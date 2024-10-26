---
title: TLDs with novel behavior
date: 2024-10-25
summary: Thoughts on .internal and gTLDs
params:
  categories:
  - getlocalcert
  - HTTPS
  - Security
---


## The internal TLD

ICANN recently 
[reserved .internal for private use](https://www.theregister.com/2024/08/08/dot_internal_ratified/),
sanctioning the use of the TLD for ad-hoc purposes.
The decision solidifies .internal for this role, which it has long supported, albeit on unofficial capacity.
The reservation was important as previous use was not sanctioned and was on shaky ground.

Consider what happened to the .dev TLD.
In 2017, programmers who used .dev for their internal development networks were shocked to find that their
[browsers suddenly required HTTPS](https://medium.engineering/use-a-dev-domain-not-anymore-95219778e6fd).
Google had registered .dev as a
[gTLD](https://en.wikipedia.org/wiki/Generic_top-level_domain)
and enabled
[HSTS preload](https://alexsci.com/blog/hsts-adoption/)
for the entire TLD.
Realizing that their usage was akin to squatting, they had little choice but to migrate to new domain names.

ICANN's reservation of .internal protects the TLD from a similar fate.


## HTTPS on .internal

The modern web runs on HTTPS, and internal networks are no exception.

Generating TLS certificates for .internal domains is fairly easy:
* make up a domain name, no registration needed
* then generate a self-signed certificate or create your own private certificate authority (CA)

The hard part is getting all the relevant devices and software to trust those certificates.
System imaging and other provisioning tools are frequently used to pre-load the CA into to the numerous trust stores.
Unfortunately, the provisioning process can be quite complicated and many organizations struggle here.
In bring your-own-device environments, or when vendors and contractors connect with their own systems, the burden of updating trust stores falls to the end user.
In many cases, incomplete rollout of the private CA leads to users clicking through certificate warning messages when connecting to internal sites.

Another challenge of private CAs is that they are often able to issue certificates for all domain names.
This is a huge security concern for any application trusting the private CA and a reason end users may avoid installing a private CA, if given the option.

It's sometimes possible to constrain private CAs, but [you've got to do it carefully](https://alexsci.com/blog/name-non-constraint/).
First, be sure to use the name constraints extension to restrict your CA to a small domain subtree, like `*.example.internal`.
You may need to switch to different CA generation software, as name constraint support is occasionally [missing](https://github.com/FiloSottile/mkcert/issues/302).
Second, make sure the client software you're using actually supports name constraints.
Client-side support for name constraints has been growing, but it's an optional extension, so it's perfectly reasonable for software to ignore it.

Private CAs are a pain to work with.


## Public CAs for internal use

If you run your internal network under a delegated TLD, like .com, then you can get a TLS certificate from a public CA.
The process of getting a certificate from a public CA is easy, great automation tools exist, and it often doesn't cost any money.
You won't be able to use the ACME HTTP protocol (which requires making your server publicly accessible, at least briefly), but the ACME DNS protocol works great on internal systems.
Using a public CA is also transparent to the end user: their device trusts the public CA out of the box.

If you already own a domain name then you can run your internal network off a subdomain, like internal.example.com, although you can register another dedicated domain.
There are some free subdomain registration services, but domain names are cheap enough that it's probably best to register your own.

One of the biggest arguments against using public CAs for private networks is that the certificates you register end up in public certificate transparency logs.
This means that anyone can list your internal host names.
Consider these:

* [internal.office.com](https://crt.sh/?q=internal.office.com&exclude=expired&group=none)
* [internal.espn.com](https://crt.sh/?q=internal.espn.com)
* [internal.amazon.com](https://crt.sh/?q=internal.amazon.com)
* [internal.microsoft.com](https://crt.sh/?q=internal.microsoft.com)
* [internal.baidu.com](https://crt.sh/?q=internal.baidu.com)
* etc

That's a little awkward.
There are some mitigations, like using obscure names or wildcard certificates, but this is a problem worthy of careful consideration.


## getlocalcert.net

A year ago, I built the [getlocalcert.net](https://www.getlocalcert.net/) service to explore and promote the use of public CAs for private networks.
The service offers free subdomains, but constrains usage to private networks.
I specifically focused on private networks as it dodges virtually all concerns of malicious use:
it's not possible to publicly host malware, illegal content, or to send spam with these subdomains.
This narrow focus has allowed me to keep registration free and open.

The getlocalcert service exposes some limited information on the public internet.
The `_amce-challenge` TXT record is available through public DNS, allowing certificate issuance via the ACME DNS verification method.
This means that our subdomain are only usable for private/internal purposes, while still supporting public CAs.


## getlocalcert.net meets gTLD

One limitation of getlocalcert is that it's implemented as a subdomain registration service.
As I mentioned earlier, it's probably better to register your own domain name than to use someone else's free subdomains.
While our inclusion on the
[public suffix list](https://publicsuffix.org/)
blurs the line a little, getlocalcert is still only offering subdomains.

But what if getlocalcert had it's own gTLD?
ICANN allows anyone to
[apply for a gTLD](https://newgtlds.icann.org/en),
although it's a complicated process and costs
[over $200,000 in fees](https://www.icann.org/en/blogs/details/icann-sets-expected-evaluation-fee-for-new-gtld-applications-in-the-next-round-25-09-2024-en).
There's lots of activity in this space with 
[almost two thousand applications](https://gtldresult.icann.org/applicationstatus/viewstatus)
currently tracked by ICANN.

There's several potentially suitable options, like .private.
Users could register domains like example.private and my-house.private, which they'd operate on their private networks.
Unlike with .internal, they'd be able to prove they uniquely own their domain name, so public CAs would be able to issue certificates.
This approach could have minimal impact to existing use, especially if domain-wide settings like HSTS preload are not enabled.

Most of the new gTLDs appear to be focused on vanity.
Domain names like example.cool and example.discount aren't functionally different from example-cool.com or example-discount.net.
But we certainly could have TLDs that *are* functionally different.
Presumably ICANN would reject a TLD that breaks too many norms, but a TLD serving a niche through constrained operation

I won't be pursuing a gTLD for getlocalcert, but the idea has been bouncing around in my head for a while now.

