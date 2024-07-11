---
title: One year of getlocalcert.net
slug: a-year-of-getlocalcert
date: 2024-07-11
summary: Reflecting on a year of running a free domain registration service
params:
  categories:
  - getlocalcert
  - HTTPS
  - Security
---


## Challenges of free domain registration

Since 2012,
[Freenom](https://www.crunchbase.com/organization/freenom)
acted as the domain name registrar for several free top level domains including .cf, .ga, .gq, .ml, and .tk.
Unfortunately, at the start of 2023, it was pretty clear that Freenom was not doing well.
Freenom was sued by Meta for ignoring abuse complaints and quickly
[halted new registrations](https://krebsonsecurity.com/2023/03/sued-by-meta-freenom-halts-domain-registrations/).

In early 2024, Freenom announced they were
[exiting the domain registration business](https://web.archive.org/web/20240213203456/https://www.freenom.com/en/freenom_pressstatement_02122024_v0100.pdf).
While this is a loss for anyone in the hobbyist and low-cost project space, there was a
[noticeable impact on phishing](https://krebsonsecurity.com/2023/05/phishing-domains-tanked-after-meta-sued-freenom/).
By March 2024, many of the domains registered on these TLDs disappered.

{{< figure
src="assets/drop-in-domains.png"
alt="netcraft.com: Nearly all .tk, .cf and .gq domains have effectively disappeared."
link="https://www.netcraft.com/blog/cloudflare-loses-22-of-its-domains-in-freenom-tk-shutdown/"
title="Via: netcraft.com"
>}}


Spam and abuse are clearly challenges.
Others who offer free subdomains, like 
[FreeDNS at afraid.org](https://freedns.afraid.org/),
seem to address spam concerns by requiring users to *solve captchas on every DNS entry update*.
These CAPTCHAs are seriously hard:

{{< figure src="assets/freedns-captcha.png" alt="Screenshot of a very unclear captcha" >}}


Thankfully, even 
[more options exist](https://free.wdh.gg/#/?id=domains),
so you can still find a free domain if you need one.
Many of these use a GitHub Pull Request approach to manage registrations:

{{< figure src="assets/gh-pr-registration.png" alt="Screenshot of a GitHub PR" >}}

One cool thing about this approach is that we can see how the abuse management process works: it's just more pull requests.
Of the ~4,200 domains hosted by .is-a.dev, there were only 15 issues tagged for abuse.
That's a pretty good ratio.

{{< figure
src="assets/gh-pr-abuse.png"
alt="Screenshot of issues tagged with abuse"
link="https://github.com/is-a-dev/register/issues?q=abuse+label%3Areport-abuse"
>}}


## Side-stepping spam

I've always wanted to run a subdomain registration service but fears of battling spam always changed my mind.

A useful approach to building hobbyist projects is to think about
the things you want to build (like a domain name registration service)
and the thing you don't want to build (like tooling for fighting spam and abuse).
Can you reduce the project's scope to avoid the latter while still providing enough features to support at least a niche use case?
For hobby projects, even a narrow use case will have tons of surface area to work on.
You can always increase scope later, if you'd like.

In early 2023, watching the fall of Freenom, I decided to build an alternative, but laser focused on a specific use case so as to avoid the spam concerns.

## What is getlocalcert?

[getlocalcert.net](https://www.getlocalcert.net)
is a (sub)domain registration service focused on private network use.
Users can register up to five free subdomains of `localcert.net` or `localhostcert.net` with their GitHub account.
We're compatible with the 
[ACME DNS-01](https://docs.getlocalcert.net/acme-clients/)
protocol and Let's Encrypt.
This mean you can get a free globally trusted wildcard TLS certificate for any web services you run.

What makes getlocalcert unique is that we don't host any `A`, `AAAA`, `CNAME`, or `MX` DNS records publicly (other than `*.localhostcert.net`, which points to `127.0.0.1`).
This means you can't use these domains for hosting websites or email publicly.
Instead, you'll need to host your own DNS records privately on your internal network.

The decision to avoid hosting public DNS records was two fold.
First, to avoid spam, malware, illegal content, or other questionable content from tainting the domain.
I wanted to avoid playing whack-a-mole with take-down requests or needing to plaster the service with CAPTCHAs.
Second, to keep the service focused on a single use case.
There's a ton of challenges to tackle with just the narrow scope I was considering.
By focusing on a smaller scope, I avoided problems that felt intractable.

{{< figure
src="assets/getlocalcert-dashboard.png"
alt="Showing the getlocalcert dashboard"
link="https://console.getlocalcert.net/"
>}}

## When to use getlocalcert

With such a restricted starting place, you may wonder how getlocalcert is even useful.
Here are the use cases I think are well suited.



### Homelab and internal networks

Many people go the private certificate authority (CA) route and use a top level domain like
[`.internal`](https://www.icann.org/en/public-comment/proceeding/proposed-top-level-domain-string-for-private-use-24-01-2024),
`.local`, `.home`, `.corp`, and others.
But private CAs need to be installed on every system that will use the network... which is awkward when your friends come over and don't want to install your trust root.
Others struggle to install the private CAs on mobile devices.
With getlocalcert, you can use free Let's Encrypt certificates, which all your devices already trust.

Consider getlocalcert if:

* you've got a private network of computers
* you run your own internal DNS resolver
* you want TLS certs on your internal web pages for HTTPS
* but you don't want to pay for a domain name, set up a private Certificate Authority, or click-though self-signed certificate warning messages.

### Testing Services

If you're testing HTTPS locally, try a `localhostcert.net` domain, which always points to localhost.
This lets your entire DevOps tools run using their own real domain and a trusted certificate, without needing to mess with DNS or private CAs.

Consider getlocalcert if:

* you're testing a web service
* you need to connect to it using HTTPS (sometimes existing client software requires HTTPS)
* but you don't want to pay for a domain name, set up a private Certificate Authority, or click-though self-signed certificate warning messages.

You don't need to register an account to use this workflow, the "instant subdomain" feature will provide you with a UUID subdomain.

### ACME DNS-01 Validation Domain

You may want a 
[ACME DNS-01 Validation Domain](https://www.eff.org/deeplinks/2018/02/technical-deep-dive-securing-automation-acme-dns-challenge-validation).
This is a really cool read, even if you don't need this approach.
Basically, you add a CNAME record that tells Let's Encrypt (and others) to validate your domain via a "throwaway" domain.
If the "throwaway" domain has a better API for updating DNS entries, you enable automation.
The best part is that with
[CAA Records](https://docs.getlocalcert.net/tips/validation-domain/#caa-records)
you don't need to trust your "throwaway" domain's DNS server.

Consider getlocalcert if:

* you have your own domain name
* you'd like to use ACME DNS-01 for certificate issuance (perhaps for a wildcard cert)
* but editing DNS entries on your existing DNS service is hard due to missing API support, bureaucracy, etc.

There's a couple tools that provide easy validation domains, including 
[acme-dns](https://github.com/joohoi/acme-dns/)
(open source, self-hosted)
and 
[Certify DNS](https://docs.certifytheweb.com/docs/dns/providers/certifydns/)
(commercial).
Check these out as well.


## Building

I had a couple false starts when I started the project.

My first pass tried to build something *very* minimal on top of afraid.org's FreeDNS.
Unfortunately, you'll usually hit 
[Let's Encrypt's rate limits](https://community.letsencrypt.org/t/urn-acme-error-ratelimited-chickenkiller-com-429/47676/2)
if you try to register issue a TLS certificate with these one of these domains.
This made it clear that I needed my own domain names and my own services.

I took a hard look at
[CoreDNS](https://coredns.io/)
for a while, but ended up choosing
[PowerDNS](https://www.powerdns.com/)
as the underlying DNS service.
PowerDNS felt more mature, stable, and was quite easy to integrate with.
I chose a Django stack to keep development productive and used server-side rendering as I didn't want to pull out React for this project.
I'll probably reach for
[Alpine](https://alpinejs.dev/)
or
[HTMX](https://htmx.org/)
if I need more interactivity.

Generating TLS certificates with ACME is a complicated process.
There's lots of tools to choose from and a number of different approaches you could take.
I spent about half the project effort building out the
[getting started documentation](https://docs.getlocalcert.net/)
and
[validating the steps](https://github.com/robalexdev/getlocalcert-client-tests).


{{< figure
src="assets/getlocalcert-docs.png"
alt="getlocalcert docs website screenshot"
link="https://docs.getlocalcert.net/"
>}}

## Launch day

I [launched on July 11th, 2023](https://alexsci.com/blog/improve-https-1/) and gathered some interest on social media.
Traffic spiked to a peak of 800 unique visits per hour.
While the vast majority of these visitors didn't create an account, I was excited to see that some users made it all the way through the funnel to TLS certificate issuance.
I expected a steep drop off in engagement due to the complexity and niche focus, so I considered these results to be a win.

## The first year

So far in 2024, I've reached some important milestones.
Thousands of domains have been registered, hundreds of certificates have been issued (340 from Let's Encrypt, 60 from ZeroSSL).
Our domain names were added to the 
[public suffix list](https://publicsuffix.org/),
so each subdomain is treated equivalently to any traditional domain by any tool that supports the list.
I have a small but steady stream of sign ups, so usage is slowly trending upwards.

On the operations side, it's been fairly low maintainance.

One breakage occurred due to Python's PIP installer refusing to [break externally managed python](https://peps.python.org/pep-0668/#implementation-notes).
This is a good change as using a venv is a much safer approach, but required Dockerfile changes to upgrade.
Thankfully testing caught this issue.

The first production outage occurred when upgrading PDNS versions due to a missed database migration.
Automated testing didn't catch this as it uses a fresh database each time which automatically used the newer schema.
Downtime was about 45 minutes.
Since the localcert.net domains require local DNS resolution, no lookup failures would have occurred.
ACME DNS certificate issuance and renewal were impacted, but renewals should have retried successfully after a delay.

Maintenance and updates have been quick and painless otherwise.
On the feature side, my focus has been elsewhere, so the service is still very much an MVP.
When I'm ready there's a fairly lengthy TODO list of improvements waiting for me.

To those who have given getlocalcert a try, thanks for being part of the journey, I hope you've built something awesome!
If you'd like to share, I'd love to hear about it.
