---
title: SMTP Downgrade Attacks and MTA-STS
date: 2024-09-30
summary: Running a bunch of mail servers to audit email security
params:
  categories:
  - MTA-STS
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

In this post, I audit several prominent mail providers to discover how they handle email encryption and show how MTA-STS can help improve email security.


## Background

When SMTP was created it was cleartext only, as we hadn't yet figured out transport layer security (TLS).
When TLS was finally ready, we needed a way to phase TLS in.
STARTTLS was created and offered opportunistic encryption.
Basically, a mail sender could ask the destination mail server: "Do you support encryption?"
If the reply was positive, then a TLS session would be established using the certificate the server provided.
If not, then a cleartext SMTP session would be used.

{{< figure
src="./starttls.drawio.png"
alt="Showing a mail server asking another about TLS support"
title="STARTTLS overview"
>}}


Anyone who's studied network security will see a problem here.
An active attacker-in-the-middle (AitM) can inject their own response, claiming that encryption isn't supported and tricking the sender into using cleartext, and allowing the attacker to eavesdrop on the message.
This is a classic downgrade attack.

{{< figure
src="./AitM.drawio.png"
alt="Showing an attacker preventing the TLS session"
title="Attacker in the middle"
>}}

Even when the receiving mail server presents a TLS certificate, troubles abound.
Consider the options a sending mail server has when it is presented with a TLS certificate it doesn't trust.
Maybe the hostname doesn't match, it's expired, or it's signed by an unknown certificate authority (CA).

1. Send using the untrusted certificate
2. Downgrading to cleartext; or
3. Refuse to send the message

Most mail senders chose the first option as it protects against passive AitM and ensures email is delivered.


### DANE and DNSSEC

DANE's TLSA record offers one possible improvement which leverages signed DNS records.

Unfortunately, DNSSEC adoption has been slow.
[Measurement studies](https://www.verisign.com/en_US/company-information/verisign-labs/internet-security-tools/dnssec-scoreboard/index.xhtml) show that around 5% of domains currently use DNSSEC.
Several large email providers like [Gmail do not support DNSSEC](https://dnssec-analyzer.verisignlabs.com/gmail.com).
As such, other options are being considered.


## MTA-STS

MTA-STS provides a way for mail servers to indicate that they will support encryption using a TLS certificate issued by a trusted certificate authority (CA).
The policy includes a `max-age` parameter that tells the sending mail server how long it should remember the policy.

{{< figure
src="./mta-sts.drawio.png"
alt="Showing how a server learns the MTA-STS policy"
title="Simplified MTA-STS usage"
>}}

I won't get into the full details of how MTA-STS works, as it involves several steps and is well documented elsewhere.


## Building an MTA-STS auditor

I stood up a pair of Postfix mail servers and configured them with a catch-all email address and a
[mailbox\_command](https://www.postfix.org/postconf.5.html#mailbox_command)
that logs incoming messages to a database.
The server **A** has a TLS certificate issued by Let's Encrypt, a widely trusted public CA.
The server **B** has TLS fully disabled.

Both servers have an MTA-STS policy set to `enforce`.

{{< figure
src="./server-config.drawio.png"
alt="Showing A with a Let's Encrypt issued certificate and B with a mkcert development CA issued certificate"
title="Mail server configurations"
>}}

These servers help me infer the sender policy by seeing which mail servers receive email.
The sender cannot distinguish B's intentionally misconfigured lack of TLS support from an AitM attack.
A sender that properly implements MTA-STS should deliver mail to A and refuse to use an unencrypted connection with B.


## Selected mail providers

I picked six mail providers for testing.
The first group are marketed to support MTA-STS:

* [Gmail](https://security.googleblog.com/2019/04/gmail-making-email-more-secure-with-mta.html)
* [Outlook.com](https://techcommunity.microsoft.com/t5/exchange-team-blog/introducing-mta-sts-for-exchange-online/ba-p/3106386)
* [Proton Mail](https://proton.me/blog/security-updates-2019)
* [Tuta Mail](https://tuta.com/blog/tutanota-letsencrypt-launch-mta-sts-tls)

The second group includes other prominent mail providers, although these do not claim to support MTA-STS:

* Fastmail
* Yahoo


## Lazy caching of MTA-STS policy

During early testing, I sent an email from Gmail to the audit servers but found that Google delivered the message to both mail servers.
Gmail has MTA-STS support, so this was surprising.
Upon further research, I found that lazy caching was the problem:

> *... fetch a new policy (perhaps asynchronously, so as not to block message delivery).*

> [RFC 8461 §5.1](https://www.rfc-editor.org/rfc/rfc8461)

When testing mail senders I needed to send multiple messages.
The first would prime the cache and additional messages would be processed using the cached policy.

This unfortunately means the first message sent to a domain could still be vulnerable to downgrade attacks, but this is intentionally permitted by the RFC for performance reasons.


## Transactional email, password reset, and magic links

Using email for password reset or email verification has long been an industry standard.
Magic links that directly log you into an account, avoiding passwords altogether, are also fairly popular.
But are those sensitive messages getting delivered without encryption?

These sorts of messages are often sent using transactional email providers, but I wasn't able to find any hosted providers that offered MTA-STS support.
It is possible to self-host Postfix and use an [MTA-STS extension](https://github.com/Snawoot/postfix-mta-sts-resolver) to do-it-yourself.
Here's the hosted providers I tested:

* Amazon SES
* Mailgun
* SparkPost

{{< figure
src="./AitM-transactional.drawio.png"
alt="Showing an attacker performing a downgrade attack"
title="Intercepting password reset links"
>}}

Most transactional email providers support some combination of toggles for enabling TLS and/or certificate verification.
These sort of toggles are difficult to enable, in practice, as some mail servers still don't support TLS and many don't use valid certificates.
[Google reports](https://transparencyreport.google.com/safer-email/overview?hl=en) that 2% of the emails they send aren't encrypted.
It's unclear how many of the encrypted connections used trusted certificates.
Requiring TLS and fully verifying certificates would block potential customers, so many websites avoid these settings for business reasons.

MTA-STS allows domains to opt-in to TLS verification while still allowing the sender to support mail servers with weaker security settings.
This is the best of both worlds.


## Results

I've also included a check for inbound MTA-STS policy, for completeness.

Here's what I found:

| Provider | Inbound | A | B | MTA-STS Support |
| -------- | ------- | - | - | ---------- |
| Gmail    | [Enforcing](https://mta-sts.gmail.com/.well-known/mta-sts.txt) | Delivered | Not Delivered | Full Support |
| Outlook.com | [Enforcing](https://mta-sts.outlook.com/.well-known/mta-sts.txt) | Delivered | Not Delivered | Full Support |
| Proton Mail | [Enforcing](https://mta-sts.proton.me/.well-known/mta-sts.txt) | Delivered | Not Delivered | Full Support |
| Tuta Mail | [Enforcing](https://mta-sts.tutamail.com/.well-known/mta-sts.txt) | Delivered | **Delivered** | Partial Support |
| Amazon SES | - | Delivered | **Delivered** | No Support |
| Fastmail | [None](https://mta-sts.fastmail.com/.well-known/mta-sts.txt) | Delivered | **Delivered** | No Support |
| Mailgun | - | Delivered | **Delivered** | No Support |
| SparkPost | - | Delivered | **Delivered** | No Support |
| Yahoo Mail | [Testing](https://mta-sts.yahoo.com/.well-known/mta-sts.txt) | Delivered | **Delivered** | No Support |


Surprisingly, Tuta Mail consistently sent the message to both mail servers.
I don't see any requests reaching the MTA-STS policy server, so there's no indication that the feature has been implemented.
Their marketing material clearly mentions MTA-STS support, and the feature is 
[marked as completed](https://github.com/tutao/tutanota/issues/461)
in their issue tracker, but perhaps only inbound MTA-STS is supported.

Otherwise, MTA-STS support matched product documentation.


## User experience

What happens when you send an email and the message can't be delivered due to MTA-STS?

You'll receive a message like these indicating that there's a problem:

{{< figure
src="./gmail-bounce-one.png"
alt="A message from Google that the message hasn't been sent yet"
title="Message delivery delayed due to MTA-STS (Google)"
>}}

{{< figure
src="./gmail-bounce-two.png"
alt="A message from Google that the message failed to be sent"
title="Message delivery failed due to MTA-STS (Google)"
>}}

{{< figure
src="./proton-bounce-one.png"
alt="A message from Protonmail that the message hasn't been sent yet"
title="Message delivery delayed due to MTA-STS (Protonmail)"
>}}

This timely feedback is critical for helping the user understand what happened to the email they sent.

{{< figure
src="./outlook-failed.png"
alt="A message from Outlook that the message failed to be sent"
title="Message delivery failed to MTA-STS (Outlook)"
>}}

Outlook only notifies the user when the message fully fails, after 24 hours.
Awkwardly, this email contains a typo and doesn't mention that a TLS verification issue prevented delivery.
Hopefully, the user experience improves over time.


## Try it yourself

To help others audit MTA-STS, I'm 
[open sourcing the project code](https://github.com/ralexander-phi/mta-sts-sender-audit)
and allowing others to use the hosted audit tool (although I don't plan to keep it online long-term).

It uses Docker Compose and assumes DigitalOcean as the hosting provider.
Substitute your own domain names and other settings where needed.
There are four other postfix servers I haven't mentioned, which help audit some other related concerns.
Check the code for full details.

While the audit infrastructure is online you can generate test email addresses and see sender information (not content) for any received email.
Messages are being logged, so don't expect any privacy for messages you send here.
Run the audit.sh tool to get started:

    $ ./audit.sh
    Send an email to these addresses:
    8a3ca551-d2d8-4f30-9661-c5dbe7b9c18d@a.audit.alexsci.com,
    c611ff0c-4920-444f-9e8d-6eef1d37f8a3@b.audit.alexsci.com,
    55c358c8-e979-4454-b14e-b8f10454e37b@c.audit.alexsci.com,
    a10c2853-40f5-4c6d-8f85-7ab38038f84e@d.audit.alexsci.com,
    b0d70539-2021-4194-adf1-d2585a162c34@e.audit.alexsci.com,
    c77b3caa-bdc7-4160-b24a-2d9646785035@f.audit.alexsci.com,

    Press any key to poll for messages, q to quit
    
    ...
    
    {
    "8a3ca551-d2d8-4f30-9661-c5dbe7b9c18d": [
        {
        "line": "Message Received:
                 SENDER: mtastsaudit@yahoo.com 
                 ORIGINAL_RECIPIENT: 8a3ca551-d2d8-4f30-9661-c5dbe7b9c18d@a.audit.alexsci.com
                 ...",
        "service": "postfix",
        "when": "2024-09-27T18:20:16Z"
        }
    ],
    "c611ff0c-4920-444f-9e8d-6eef1d37f8a3": [
        {
        "line": "Message Received:
                 SENDER: mtastsaudit@yahoo.com 
                 ORIGINAL_RECIPIENT: c611ff0c-4920-444f-9e8d-6eef1d37f8a3@b.audit.alexsci.com
                 ...",
        "service": "postfix",
        "when": "2024-09-27T18:20:16Z"
        }
    ]
    }
    Press any key to poll for messages, q to quit

This shows that Yahoo delivered email to both the A and the B server.


## Enable *inbound* MTA-STS for your domain

If you receive email on your own domain, consider enabling MTA-STS.
Increased adoption of MTA-STS will help encourage mail senders to add support.
Check with your email provider to learn how you can get started.
Here's the official documentation for the mail providers I've tested:

* [Google](https://support.google.com/a/answer/9276511?hl=en)
* [Outlook.com](https://learn.microsoft.com/en-us/purview/enhancing-mail-flow-with-mta-sts#how-to-adopt-mta-sts)

Protonmail doesn't claim to support MTA-STS for custom domains, but others have offered solutions:

* [Protonmail](https://www.reddit.com/r/ProtonMail/comments/y6q6g8/mtasts_for_custom_domains/)

The general process for enabling *inbound* MTA-STS is well documented too:

* [Using Apache](https://www.digitalocean.com/community/tutorials/how-to-configure-mta-sts-and-tls-reporting-for-your-domain-using-apache-on-ubuntu-18-04)
* [Using GitHub Pages](https://emailsecurity.blog/hosting-your-mta-sts-policy-using-github-pages)

Fastmail and Yahoo use certificates from DigiCert, a trusted CA, so they could enable *inbound* MTA-STS without much work.

You should always set up TLSRPT when enabling MTA-STS, so be sure to enable that as well.


## Closing thoughts

MTA-STS provides a promising approach to strengthening SMTP security.
Unfortunately adoption by major providers is low.

The lack of MTA-STS support by hosted transactional email providers exposes the password reset emails of countless websites vulnerable to downgrade attacks and snooping.
Everyone should encourage transactional email providers to adopt MTA-STS.

Google provides the best user experience for messages that have been delayed or failed due to MTA-STS.
Notifying the user about the problem quickly, and providing several updates was very helpful.
Implementers should be sure to consider how they communicate MTA-STS induced behaviors to their users.


## End notes

HSTS is a similar technology that helps us secure websites.
HSTS uses a preload list which allows web browsers to ship with a list of domain names that are well-known to support HSTS.
SMTP used to have the STARTTLS policy list, but this [shut down in favor of MTA-STS](https://www.eff.org/deeplinks/2020/04/technical-deep-dive-winding-down-starttls-policy-list).

Like HSTS, the MTA-STS RFC doesn't specify which certificate authorities should be used when validating a certificate.
The server is promising to use a certificate that the client (I.E. web browser, or connecting mail server) will trust.
This centralizes the decision of which CAs to trust in the hands of the popular web browsers (like Chrome) and popular mail providers (like Gmail).
Web browsers have rapidly dropped support for CAs after security incidents, so mail servers need to keep track of which CAs the senders trust and adjust when needed.

There's a ton of extra information I'm collecting with this test framework:

* TLSRPT - Aggregate reports from mail senders about failed messages
* HTTP logs showing MTA-STS policy file fetching
  * Logs indicate that Proton Mail uses `postfix-mta-sts-resolver`, hinting that they run a Postfix stack
* IPv6 support

Future research could build on this foundation.

Finally, here's a TLSRPT report from Microsoft.
You can see that I tried a couple different configurations, but Microsoft correctly rejected the connection.


{{< figure
src="./ms-tlsrpt.png"
alt="JSON document showing failed connections due to starttls-not-supported and certificate-not-trusted"
title="Sample TLSRPT report"
>}}

