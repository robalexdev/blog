---
title: Is email confidential in transit yet?
date: 2024-11-04
summary: Measuring vulnerable SMTP configurations and defenses
params:
  categories:
  - MTA-STS
  - DANE
  - SMTP
  - Security
---


{{< rawhtml >}}
<style>
td, th {
  padding: 0.6em;
  border: 1px dashed #ccc;
  text-align: center;
}
</style>
{{< /rawhtml >}}

When I've talked to developers about the confidentiality of email in transit, between mail servers, I usually hear one of these responses:

* Everyone knows email isn't secure
* While email is vulnerable, hop-to-hop connections between servers are secure enough
* Email is secure because every modern mail server uses TLS

Which is it?

{{< figure
    src="is-email-secure-2.drawio.png"
>}}

In this post, I explore the current state of server-to-server transport encryption and examine the confidentiality challenges we still face.

## Reducing scope

There's a lot of areas to consider here, so I want to start by refining the scope.
Email travels quite a bit: from the author of the message's device to their mail server, between mail servers, and finally to the recipient's device so they can read it.
I'm focusing solely on the confidentiality of messages as they transit between mail servers.

I **won't** be covering:

* Spam
* Message integrity (DKIM)
* User submission and retrieval of messages
* Denial of service and other attacks
* End-to-end message encryption (S/MIME and PGP)


## Should senders require TLS?

Google publicly tracks the volume of unencrypted email they send.
As of 2024, they cite that
[2% of the email they send](https://transparencyreport.google.com/safer-email/overview?encrypt_out=start:1727740800000;end:1729641599999;series:outbound&lu=encrypt_in&encrypt_in=start:1727740800000;end:1729641599999;series:inbound)
is sent unencrypted.
Similarly, Cloudflare reports that [6% of the email they receive](https://radar.cloudflare.com/email-security?dateStart=2023-10-21&dateEnd=2024-10-21) is received unencrypted.
These messages are vulnerable to passive eavesdropping.
This contradicts the notion that *everyone* uses TLS so we've got to dig in further.

Here's the worst offenders, by volume, according to Google:

{{< figure
    src="google-red-domains.png"
    title="Google SMTP Transparency Data: World"
>}}

{{< figure
    src="google-red-domains-americas.png"
    title="Google SMTP Transparency Data: Americas"
>}}


Many of these domains are operated by financial institutions, or telecoms.
If you decided to require TLS you'd be unable to send mail to the organizations on the right.
Looking at the list, you may not know any of these companies, so maybe this doesn't seem like a problem.
But any large email provider sees a meaningful volume of unencrypted outbound email, so "mandatory TLS" still isn't a reasonable default policy.


## TLS isn't enough

While the progress to encrypt over 90% of email in transit has been a great success, TLS isn't a complete solution.
Most servers use *opportunistic TLS* as their default policy.
In this mode senders *blindly accept* whatever certificates they receive.
It doesn't matter if the certificate is expired, self-signed, or for the wrong host name: the sender **doesn't verify** the certificate.
Opportunistic TLS is still a huge step forward, as it prevents passive eavesdropping, but it cannot protect against active attacks.

I explored this issue and some of the solutions in a
[previous blog post](https://alexsci.com/blog/smtp-downgrade-attacks-and-mta-sts/).
Even when sending servers support DANE and/or MTA-STS, they often need to send mail to domains that don't.
The most common fallback behavior continues to be opportunistic TLS, which doesn't verify certificates.


{{< figure
    src="AitM.drawio.png"
    title="Opportunistic TLS: certificates aren't validated"
>}}


## Should senders verify certificates?

Most popular mail server software and services support TLS certificate verification as a non-default configuration option, so why not enable it?

In 2018, EFF reported that
[about half](https://www.eff.org/deeplinks/2018/06/technical-deep-dive-starttls-everywhere)
of the mail servers supporting STARTTLS used self-signed certificates.
There's lots of documentation that cites widespread use of self-signed certificates, expired certificates, or certificates with mismatched host names.

Verifying certificates wasn't really an option earlier, but what about today?

To learn more I scanned
[Cloudflare's list of the top 1,000 domain names](https://radar.cloudflare.com/domains) to:
* identify mail servers (when present)
* check for STARTTLS support; and
* check if the certificate was issued by a public CA

[The project code is open source](https://github.com/ralexander-phi/smtp-starttls-scanning), so you can run your own analysis.

Here's a summary of key statistics:
* 1,000 domain names checked
* 544 domains had MX records

Of the 544 domains supporting email:
* 99.3% had STARTTLS support (540 domains)
* 94.1% used valid certificates issued by a public CA (512 domains)

This is exceptional progress.
Unfortunately, I still can't recommend TLS certificate verification as a default policy, as a small number of domains still lack STARTTLS and CA-issued certificates.

MTA-STS and DANE remain the best options for securely authenticating mail servers.


## Have we adopted DANE yet?

To answer this question, I downloaded the larger "top 100,000 domains" list from Cloudflare Radar.
I scanned each domain to identify mail servers, DNSSEC support, DANE support, and MTA-STS support.
Of the scanned domains, 65,244 supported email (I.E. had MX records).

The [code for this scanner](https://github.com/ralexander-phi/mail-server-security-scanner)
is also open source.

Of the domains supporting email:

* 8% supported DNSSEC (5436 domains)
* 0.9% supported DANE (564 domains)

There's lots of consolidation of email hosting providers.
Here are the top providers seen during scanning:

| Domains | Provider | Inbound DANE support |
| ------- | -------- | -------------------- |
| 20,838  | google.com            | No      |
| 10,480  | outlook.com           | Optional |
| 8,539   | googlemail.com        | No      |
| 3,150   | pphosted.com          | No      |
| 1,511   | mimecast.com          | No      |
| 1,294   | registrar-servers.com | No      |
| 1,271   | amazonaws.com         | No      |
| 1,039   | qq.com                | No      |
| 886     | cloudflare.net        | **Yes** |
| 584     | yandex.net            | No      |

If you want inbound DANE support for your mail, you may need to shop around.

Outlook [began rolling out inbound DANE support](https://techcommunity.microsoft.com/t5/exchange-team-blog/announcing-public-preview-of-inbound-smtp-dane-with-dnssec-for/ba-p/4155257)
in 2024.
Domains need to opt-in to Outlook's DANE support, so roll-out will take time.
For each domain using outlook.com's mail servers, I checked for TLSA records on the customer subdomain (I.E.: *customer*.mail.protection.outlook.com).
None had DANE support enabled.


## Have we adopted MTA-STS yet?

Looking again at my list of 65,244 domain names:

* 1.2% supported MTA-STS (792 domains)
* 0.7% used MTA-STS in 'enforce' mode (415 domains)

Edit: I had originally missed MTA-STS policy delegation (CNAME). I rescanned the domains and have updated the numbers with around 50 more domains.

To support MTA-STS, a mail server needs to have a TLS certificate issued by a public CA.
Thankfully, these are easy to find:


| Domains | Provider | Public CA-issued certificate |
| ------- | -------- | -------------------- |
| 20,838  | google.com            | Yes |
| 10,480  | outlook.com           | Yes |
| 8,539   | googlemail.com        | Yes |
| 3,150   | pphosted.com          | Yes |
| 1,511   | mimecast.com          | Yes |
| 1,294   | registrar-servers.com | Yes |
| 1,271   | amazonaws.com         | Yes |
| 1,039   | qq.com                | Partial |
| 886     | cloudflare.net        | Yes |
| 584     | yandex.net            | Yes |

Before you rush off to enable MTA-STS on your domain, remember that providers can change their TLS configuration.
Ask your provider if they are committed to using valid, CA-issued TLS certificates long-term.
Ideally, they should document this publicly.

qq.com's *mxdomain.qq.com* mail server's certificate currently doesn't match its host name, but all the other qq.com mail servers use trusted certificates.
This issue won't prevent you from using MTA-STS with qq.com, as the sender would switch to one of the other mail servers.
But again, I'd recommend checking if your provider will commit to ongoing use of public CA-issued certificates first.

While support for DANE and MTA-STS are both very low, MTA-STS was present on more domains.
There isn't a clear leader, as many of the MTA-STS policies weren't in *enforce* mode.
Since MTA-STS is a newer technology,
[2018 for MTA-STS](https://www.rfc-editor.org/rfc/rfc8461) vs. [2012 for DANE](https://datatracker.ietf.org/doc/html/rfc6698)),
MTA-STS adoption appears to be more rapid.
The widespread use of public CA-issued certificates means that the majority of domains may be able eligible to enable inbound MTA-STS, without changing mail providers.


## Are there attackers in the middle?

One of the common responses to concerns about email confidentiality in transit is that server-to-server connections are sufficiently secure.
Consolidation of email has lead to a large volume of email being sent between several major providers, like Google's Workspace and Microsoft 365.
Connections between the Microsoft Cloud and the Google Cloud are vastly different than user-to-server connections (where concerns like malicious WiFi routers exist).
It seems possible that your email is secure, in practice, because the network routes between servers only includes trustworthy network operators.

In 2015, a joint report by University of Michigan, Google, and University of Illinois, Urbana Champaign on
[STARTTLS stripping](https://dl.acm.org/doi/pdf/10.1145/2815675.2815695)
offered a chilling overview of observed attacks:

* "in seven countries, more than 20% of all messages are actively prevented from being encrypted"
* "We identify 41,405 SMTP servers in 4,714 ASes and 193 countries that cannot protect mail from passive eavesdroppers due to STARTTLS corruption on the network."
* "96% of messages sent from Tunisia to Gmail are downgraded to cleartext"

Attackers are present.


## What's the impact?

Admittedly, lots of email isn't sensitive, so securing it provides little marginal value.
Most email isn't even wanted (estimates for spam range from 45% to 85% of all email).
What if we drill down into messages that are obviously sensitive?

Consider password reset emails.

Email-backed accounts are extremely common on the web and an attacker could perform account takeover if they intercept password reset emails.
I tested several services and found the same result: they don't require TLS when sending password reset emails.

One of the most sensitive services I can think of that uses password reset emails is Amazon AWS, so let's consider their approach.
I spun up a test mail server, disabled TLS, and signed up for an AWS account.
I then clicked through the password reset flow a couple times.
AWS always sent the password reset email in cleartext, without any encryption.

Looking at the email headers, AWS used it's own Amazon SES to deliver the password reset email.
SES supports the
[`Require` TLS policy](https://docs.aws.amazon.com/ses/latest/dg/security-protocols.html#security-ses-to-receiver),
but it's not being used here.
This leads me to believe that AWS chose not to require TLS for these sensitive messages.

If you're scratching your head, remember that multi-factor authentication (MFA) mitigates this issue.
Amazon
["strongly recommends" MFA](https://docs.aws.amazon.com/IAM/latest/UserGuide/enable-mfa-for-root.html)
for the root account.
AWS has numerous high-quality MFA options, so I don't think there's a meaningful account takeover risk here... as long as you use MFA.

I want to emphasize, AWS is not alone here.
I couldn't find a service that required or verified TLS for password reset emails.
Knowing the history of email security this isn't surprising, but at some point, I hope this would change.


## The path forward

While the number of servers supporting TLS and server authentication has risen greatly, the number of senders requiring and validating TLS certificates is still very low.
Adoption of DANE and MTA-STS are also low.
Even seemingly high sensitivity email, like AWS root account password reset emails, remain vulnerable to 2002-era downgrade attacks.

We can do better.

If you run a mail provider that supports multiple domains, consider centrally hosting the MTA-STS policy server for your customer's domains.
You'll need to issue certificates (likely using ACME HTTP-01) for each connected customer domain.
This would further simplify the MTA-STS set up process (add an A record and a TXT record), bringing the overall complexity for customers in line with setting up DKIM and SPF.

If you run a mail server, make sure you have a TLS certificate that supports server authentication.
Consider enabling 
[DNSSEC/DANE](https://en.wikipedia.org/wiki/DNS-based_Authentication_of_Named_Entities) and
MTA-STS for both inbound and outbound email.

If you accept mail on your domain, consider adding inbound support for MTA-STS (if your mail provider can support it) and
[TLS-RPT](https://www.gov.uk/government/publications/email-security-standards/using-tls-reporting-tls-rpt-in-your-organisation).
[Jean's MTA-STS guide](https://blog.jeanbruenn.info/2021/07/31/howto-setup-mta-sts-and-tlsrpt/)
is a great starting point.
Finally, you may add your domain to [the MTA-STS cache warming list](https://github.com/ralexander-phi/mta-sts-cache-warming/).

Investigate your logs to see what behaviors are present.
How much of your email is encrypted?
Can you find any evidence of downgrade attacks?
How much mail would be impacted if you changed your TLS policies?

If you use a hosted email provider, find out their transit security policy.
Prompt them to adopt DANE or MTA-STS.
Encourage them to report statistics about how many unencrypted messages they send and receive.

Email should be confidential. It's going to take more work to protect messages in transit.


## Closing notes

One challenge was deciding which CAs should be considered trusted.
I used the list installed by Debian's [ca-certificates package](https://packages.debian.org/bookworm/ca-certificates).
CA trust is a really important concern and there's a variety of different trust stores you could pick, each of which contain some differences.
I'm not sure if I picked the "best" trust store for this measurement, but any popular trust store was probably sufficient.
Conversely, mail servers should select a CA that is widely trusted, such that any sender will be able to validate their certificate.

The test server I used when checking AWS's password reset emails was
[MTA-STS test system "B"](https://alexsci.com/blog/smtp-downgrade-attacks-and-mta-sts/#building-an-mta-sts-auditor)
described in an earlier blog post.
This mail server had MTA-STS enabled, so senders supporting MTA-STS should not send it unencrypted email.
As Amazon SES doesn't support MTA-STS, the AWS password reset email was delivered anyway.

Another experiment I ran considered if CAs require TLS certificates when using email-based domain control validation (DCV).
[They don't](https://indieweb.social/@robalex/113393233410313491).

