---
title: MTA-STS Preload
date: 2024-11-11
summary: Tracking domains that support MTA-STS
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

SMTP MTA Strict Transport Security (MTA-STS) is a mechanism for securing email as it travels between mail servers.
Similarly to DANE, MTA-STS signals to the sender that they should use TLS and should validate TLS certificates when sending messages.
Without these tools, email is vulnerable to STARTTLS downgrade attacks.

MTA-STS offers protection by caching the receiving domain's policy, if any exists.
Once the policy has been cached, the sender will continue to validate TLS certificates for the destination domain, through a "max\_age" limit.
However, if the policy has not been cached and an attacker blocks the MTA-STS lookup, then the connection remains vulnerable.
This means that MTA-STS cannot protect the first message being sent to a domain, and cannot protect against an attacker who persistently blocks the policy lookup.


## Web browsers and HSTS

A similar challenge exists on the web.

When a user connects to a website and the website presents an invalid certificate (like a self-signed certificate) the browser doesn't know if it's safe to continue.
Since it's possible that a self-signed certificate is intentional, the browser asks the user for help.
Unfortunately, users aren't the best at knowing if it's safe to continue: some will click through the warning, allowing an attacker-in-the-middle to intercept their traffic.

The web addresses this problem with HTTP Strict Transport Security (HSTS).
When a user connects to a website, the website includes an HSTS header that informs the browser that the website uses HTTPS and that the operators intend to keep their certificate valid.
Once cached, the browser will refuse to connect to the website over unencrypted HTTP or when the certificate appears invalid.
The user isn't given an option to proceed as the browser is now confident that there's a security problem.

Unfortunately, web browsers can't know the HSTS policy of a domain until they see the HSTS header.
This means that the first request to a website is vulnerable.
Generally, this isn't a large problem.
For many websites, users make many return visits from the same device, so the window of vulnerability is quite small.
But there are enough websites with high threat models and specific use cases that prevent HSTS header caching (like a website you only access when setting up a new device).

Web browsers address the first-connection vulnerability using the HSTS preload list, which is installed with the web browser.
The preload list tracks websites that are well known to support HSTS and ensures that even the first connection is protected by HSTS.
There are challenges with the preload list, like it's size, but it's a viable solution.


## Bringing preloading to email

Senders who are concerned about the vulnerability of the first message sent to a domain will want additional protection.
As part of my project to [measure MTA-STS adoption](https://alexsci.com/blog/is-email-confidential-in-transit-yet/)
I ended up building a list of domains with support.

I published the list in a [GitHub repo](https://github.com/ralexander-phi/mta-sts-cache-warming)
and created a pull-request based workflow for adding additional domains.
The list currently includes almost 3,000 domains.

I reached out to Vladislav, the creator of the [MTA-STS resolver for Postfix](https://github.com/Snawoot/postfix-mta-sts-resolver),
and he pointed me towards a way to pre-warm the cache.
First enable the `proactive_policy_fetching` setting in `/etc/mta-sts-daemon.yml` and then scan the domains with postmap.
Here's an example showing gmail.com being added to the cache (indented for clarity):

    $ /usr/sbin/postmap -q gmail.com socketmap:inet:127.0.0.1:8461:postfix
    secure match=gmail-smtp-in.l.google.com:.gmail-smtp-in.l.google.com servername=hostname

    $ sqlite3 /var/lib/mta-sts/cache.db "SELECT * FROM sts_policy_cache"
    gmail.com|1731210152|20190429T010101|{
        "mx": [
            "gmail-smtp-in.l.google.com",
            "*.gmail-smtp-in.l.google.com"
        ],
        "version": "STSv1",
        "mode": "enforce",
        "max_age": 86400
    }

This approach works great as it double checks if the domain still has MTA-STS support.

You can warm your MTA-STS cache with this command, which downloads the latest preload list and processes each domain with postmap:

    $ curl https://raw.githubusercontent.com/ralexander-phi/mta-sts-cache-warming/refs/heads/main/mta-sts-hints.txt \
      | /usr/sbin/postmap -q - socketmap:inet:127.0.0.1:8461:postfix

You may want to run this command when setting up a new Postfix server or when enabling MTA-STS support for the first time.
The one-liner can also be run as a cron job, if you'd like to keep your cache up to date as the preload list grows.


## Policy delegation

MTA-STS supports [policy delegation](https://www.rfc-editor.org/rfc/rfc8461#section-8.2),
where the MTA-STS DNS records use CNAME to point to records hosted by their email provider.
Without policy delegation, a domain wishing to enable MTA-STS needs to host their MTA-STS policy document on their own.
While a traditional web server could be used,
[static web hosting providers are also suitable](https://emailsecurity.blog/hosting-your-mta-sts-policy-using-github-pages).

There are several companies that offer MTA-STS policy hosting:

* EasyDMARC - [easydmarc.pro](https://support.easydmarc.com/knowledge-base/migrate-mta-tls-to-managed)
* Red Sift - [ondmarc.com](https://redsift.com/pulse-platform/ondmarc)
* Mailhardener - [mailhardener.com](https://www.mailhardener.com/blog/introducing-hosted-mta-sts#mailhardener-hosted-mta-sts)
* URIports - [uriports.com](https://www.uriports.com/blog/hosted-mta-sts/)
* Sendmarc - [sdmarc.net](https://help.sendmarc.com/mta-sts-a-guide-by-sendmarc)
* mta-sts.tech - I'm unsure who runs this

I'd like to see more mail providers add first-party support for MTA-STS policy hosting.
It really simplifies adoption.
A domain owner can enable MTA-STS by setting two DNS records; without needing to provide their own policy hosting.

    _mta-sts.example.com    3600    IN  CNAME   _mta-sts.mail-provider.com
    mta-sts.example.com     3600    IN  CNAME   mta-sts-enforce.mail-provider.com
    
This would make the complexity of configuring MTA-STS similar to setting up SPF or DKIM records, easing the burden of enabling MTA-STS on a domain.

