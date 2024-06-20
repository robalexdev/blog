---
title: Name "Constrain't" on Chrome
slug: name-non-constraint
date: 2023-04-01
summary: When Name Constraints ain't enforced
params:
  guid: fa55ab56-3d78-4e5a-837d-0822b1916b12
  categories:
  - HTTPS
  - Security
---

## Abstract

The X.509 Name Constraints extension is a powerful way to limit a certificate authority (CA) to only issue certificates for specific TLDs or domain names.
Unfortunately, Google Chrome doesn't currently enforce name constraints for user imported trust roots on Linux.
Review of related blog posts shows that developers have a poor understanding of how this feature is implemented, which could have unintended security impact.
While Chrome's behavior is standards compliant, it is inconsistent with other web browsers, other TLS clients, and even Google Chrome running on different operating systems.
Starting with the next Chrome release, enforcement of name constraints for trust roots will be enabled.

## HTTPS on internal networks

Let's say you run an internal network, probably using domains under
`.local`.
A public CA can't issue HTTPS certificates for
`.local`
because this TLD is not part of the public, global DNS system.
No one can prove ownership of these domain name names, so the public CAs don't work here.
If you're building with HTTPS, you may try creating a private CA.

Creating your own private CA is well documented online, so it's easy to get started.
Unfortunately, as I'll explain, lots of documentation has omissions and security problems.

## A quick guide

Let's start with
[this guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-and-configure-a-certificate-authority-ca-on-ubuntu-20-04)
from DigitalOcean.
DigitalOcean has some great documentation, so this looks like a good reference.

Following the instructions, I can create a private CA and issue a certificate for `test.local`.
I'm going to use a Linux Mint 21.1 VM for this.
Google Chrome version is `111.0.5563.146` (released March 2023) and Firefox is `108.0.1` (released December 2022).

The easiest way to confirm my work is to import the private CA into my browser trust store, start a web server, and load the page with Chrome.
I'll do this with:

    echo "127.0.0.1 test.local" >> /etc/hosts
    openssl s_server -key test-server.key -cert test-server.crt -accept 8080 -www -chainCAfile ca.crt

I can see that everything works in Chrome. Success!

{{< figure src="valid-test-local-page.png" alt="Chrome loads test.local" >}}

## Private CAs have broad scope

Unfortunately, I've actually created a private CA with way too much power.
If I follow the instructions from the DigitalOcean post again, but using `www.google.com`, I'll also get a valid certificate.
When I run `openssl s_server` with this new certificate, Chrome trusts it too.

{{< figure src="valid-google-page.png" alt="Chrome loads google.com" >}}

My concern is that compromise or misuse of the private CA makes it easier to perform a man-in-the-middle attack against any browser that trust that CA.
The web browser will consider the misissued certificate as valid, so the user will have no indication that something bad has happened.

## Using a better guide

Perhaps the issue is just that I picked the wrong guide, DigitalOcean hosts great content, but this one didn't have what I wanted.
Let's choose a different blog, like
[this one](https://systemoverlord.com/2020/06/14/private-ca-with-x-509-name-constraints.html)
which was written by a Google security engineer.

This guide focuses on the X.509 certificate extension known as Name Constraints.
A certificate can specify name constraints such that it can only issue certificates that fall under a specified TLD or domain name.
That sounds like a great mitigation, it reduces the scope of impact for a compromised private CA.
Let's try it out.

Following the instructions, I see openssl confirm that `test.crt` is valid and `test2.crt` is invalid.

    $ openssl verify -CAfile ca.crt test.crt
    test.crt: OK
    $ openssl verify -CAfile ca.crt test2.crt
    CN = test2.example.org
    error 47 at 0 depth lookup: permitted subtree violation
    error test2.crt: verification failed

Great, it really looks like I've done it.
Our private CA can issue certificates for `.example.com`, but not `.example.org`.

## TLS client behavioral differences

But I'd like to take one more verification step, I'll check my certificates in Chrome.
After all, my users will connect via a web browser, not using the OpenSSL command line tool.

As expected, `test.example.com` works:

{{< figure src="valid-nc-test.png" alt="Chrome loads test.example.com" >}}

But, yikes!  `test2.example.org` also works:

{{< figure src="valid-nc-test2.png" alt="Chrome loads text2.example.org" >}}

Does Firefox see the same thing?

{{< figure src="invalid-nc-test-ff.png" alt="Firefox warning for test2.example.org" >}}

No, Firefox says that the CA `is not permitted to issue a certificate with this name`, which is what I had hoped Chrome would do.
It sort of looks like a bug in Google Chrome's TLS implementation.
What's actually happening here?

## Optional parts of the standard

[This chromium issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1072083) has a great explanation of what's going on.
First, notice that both Firefox on Linux and Chromium on macOS reject the certificate.
So this appears to be Chrome on Linux specific behavior.

Ryan Sleevi gives a great answer about this, which I'll quote:

> "It sounds like you're placing nameConstraints on the root, which is not supported, not only in Chrome, but many major PKI implementations. That's because RFC 5280 does not require such support; imported root certificates are treated as trust anchors (that is, only the Subject and SPKI are used, not other extensions)",

> "this may be WontFix/WorkingAsIntended",

and

> "Marking this as not a Security Bug."

Looking at the
[RFC text](https://www.rfc-editor.org/rfc/rfc5280)
I see: 

* *"Where a CA distributes self-signed certificates to specify trust anchor information, certificate extensions can be used to specify recommended inputs to path validation."*
* *"Similarly, a name constraints extension could be included to indicate that paths beginning with this trust anchor should be trusted only for the specified name spaces."*
* *"Implementations that use self-signed certificates to specify trust anchor information are free to process or ignore such information."*

I agree, a TLS client can choose to process or ignore name constraints.
Either choice is standards compliant.


Ryan also provides a workaround: *"place the constraints on the intermediate"*.
Unfortunately, placing constraints on the intermediate leaves the root certificate unconstrained, so it's a partial fix only for my use case.

## Let's visualize the concern

Instead of adding name constraints on the private CA's root certificate, I could create an intermediary certificate and put the name constraint there.
Then I'd issue certificates only with the intermediary cert.

{{< rawhtml >}}
<pre class="mermaid">
  flowchart LR
    A(ROOT) -.-> B(INTERMEDIARY<br>name constrained) -.-> C(WEBMAIL.LOCAL) & D(WIKI.LOCAL)
    style A fill:#8f8;
    style B fill:#8f8;
    style C fill:#8f8;
    style D fill:#8f8;
</pre>
{{< /rawhtml >}}

If the intermediate certificate is stolen, it could be used to issue additional certificates for the attacker.
If the attacker issued certificates that violate the name constraints, a compliant client would reject them, mitigating the MITM attack risk.
So we've limited the scope to just the constrained namespace.

{{< rawhtml >}}
<pre class="mermaid">
  flowchart LR
    A(ROOT) -.-> B(INTERMEDIARY<br>name constrained) -.-> C(WEBMAIL.LOCAL) & D(WIKI.LOCAL) & E(WEBMAIL.LOCAL)
    B -.-x F(SECURE.EXAMPLE.COM)
    style A fill:#8f8
    style B fill:#8f8
    style C fill:#8f8
    style D fill:#8f8
    style E fill:#8f8,stroke:#f66,stroke-width:3px,stroke-dasharray: 5 5
    style F fill:#bbb,stroke:#f66,stroke-width:3px,stroke-dasharray: 5 5
</pre>
{{< /rawhtml >}}

Unfortunately, a stolen root certificate behaves differently.
Google Chrome on Linux won't honor any name constraints on the root, so the attacker can issue certificates for any domain name.
Web browsers will consider these certificates to be valid, and the MITM attack can proceed unnoticed.

{{< rawhtml >}}
<pre class="mermaid">
  flowchart LR
    A(ROOT) -.-> B(INTERMEDIARY<br>name constrained) -.-> C(WEBMAIL.LOCAL) & D(WIKI.LOCAL) 
    A -.-> E(WEBMAIL.LOCAL) & F(SECURE.EXAMPLE.COM)
    style A fill:#8f8;
    style B fill:#8f8;
    style C fill:#8f8;
    style D fill:#8f8;
    style E fill:#8f8,stroke:#f66,stroke-width:3px,stroke-dasharray: 5 5
    style F fill:#8f8,stroke:#f66,stroke-width:3px,stroke-dasharray: 5 5
</pre>
{{< /rawhtml >}}

It should go without saying that all CA private keys, especially for the root, need to be handled with security best practices.

## Chrome's plan

Starting with
[Chrome 112](https://chromium.googlesource.com/chromium/src/+/d98bb87b118a89e74687281c3127da6028c26423/components/policy/resources/templates/policy_definitions/Miscellaneous/EnforceLocalAnchorConstraintsEnabled.yaml)
name constraints will be enforced for user imported trust roots.
Chrome 112 is currently in beta, so let's give it a try:

{{< figure src="invalid-nc-test-chrome-beta.png" alt="Chrome beta warning for test2.example.org" >}}

Success!
Chrome on Linux will soon behave the same as Chrome on macOS and Firefox.
*(Since this post was published, [Chrome 112](https://chromereleases.googleblog.com/2023/04/stable-channel-update-for-desktop_14.html) has been reached the Stable channel).*

I'm happy Chrome is implementing this feature as it brings Chrome's handling of X.509 certificates more inline with developer expectations.

## Closing

One remaining concern of mine stems from Ryan's assessment of the TLS client landscape:
*"nameConstraints on the root, [...] is not supported, not only in Chrome, but many major PKI implementations"*.
While Google Chrome will add support very soon, other fully standards compliant TLS clients may continue to lack support.
A TLS client can defend their lack of support, citing that the RFC considers enforcement to be optional.
It's unclear to me which clients enforce name constraints on trust root and which don't, so I'm wary to consider name constraints as more than a partial mitigation.

Developers tend to test on one platform and assume that security behaviors will match on others, but this isn't the case.
Tracking behavioral differences of TLS implementations is a hard problem.
[Netflix created BetterTLS](https://bettertls.com/)
to track standards implementation of TLS clients.
The results for Chromium show no failed tests, even though I clearly demonstrated enforcement was missing.
I suspect this is because Chrome's lack of enforcement is standards compliant, even if it's undesired.

My best guidance, for now, is to consider all private CAs as if they could issue certificates for the entire Internet.
Treat the private keys of your private CAs with the utmost care to protect them from compromise or misuse.
Avoid trusting a private CA unless you are sure the private keys will be properly protected.

## Files

If it's helpful to anyone, I'm sharing
[the private CAs and certificates](./certs.tar.gz)
I created.
Some of these are password protected, the password is `1234`.
Please don't use this outside a VM or other isolated environment, these are leaked keys and they are unsafe.

{{< rawhtml >}}
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: true });
</script>
{{< /rawhtml >}}
