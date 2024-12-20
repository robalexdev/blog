---
title: The next stage of getlocalcert.net
date: 2024-11-05
summary: Keeping the project going
slug: shutting-down-getlocalcert
params:
  categories:
  - getlocalcert
  - HTTPS
  - Security
---

**Update:** In exciting news, the getlocalcert.net project will continue under new management.
I'm grateful to [William Harrison](https://wharrison.com.au/) for taking the lead on future development.
Over the next month, I'll be transferring domains, servers, and other project resources.
There may be short periods of downtime during the transition, but users should be minimally disrupted.

Please consider sponsoring William to support this next stage of the project.

*This post previously claimed the project would be shut down. The original post follows, with references to shut down removed.*

I started the getlocalcert.net project to explore two key ideas:

* Are public CA-issued certificates useful on private networks?
* Can I offer free and anonymous subdomain registrations without fighting spam?

The answer to both questions has been yes.


## Adoption

Here's some statistics.

Since the July 2023 launch, around 900 users logged in with GitHub.
Anonymous registration complicated measuring unique users, but I believe 2,000 unique users accessed the service.
Those users created 3,500 zones and 450 TLS certificates ([1](https://crt.sh/?q=localhostcert.net), [2](https://crt.sh/?q=localcert.net)).
Around 370 of those were issued by Let's Encrypt and 70 by ZeroSSL.

The longest active subdomain was from [the original launch, July 2023](https://news.ycombinator.com/item?id=36674224).
In all, 17 subdomains were were actively renewing their TLS certificates.

It's difficult to know exactly what the subdomains were used for, as they were only used on private networks, but keywords in the names provide some hints:
* nas
* pihole
* proxmox

I made signup as frictionless as possible, so 20% of users reaching the marketing page logged in with GitHub.
But issuing a TLS certificate requires installing an ACME client, which requires more effort, and many users didn't get that far.


## Split-DNS avoided abuse

Since the project was focused on private domain usage, there was no need to support any public IP address ranges.
Without public IP addresses there was little opportunty for users to host malware, phishing sites, or illegal content.
To avoid spam email from these domains I configured PowerDNS to publicly host some [default records](https://github.com/robalexdev/docs.getlocalcert.net/blob/main/website/docs/records/index.md#email-records), like a null MX record, a null DKIM, and an empty SPF list.

This approach proved to be extremely effective.
I was able to keep anonymous subdomain registration open, even without CAPTCHAs.

