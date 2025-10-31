---
title: Oops, my UUIDs collided!
slug: uuid-oops
date: 2025-10-31
summary: Why UUID collisions happen in practice
params:
  categories:
  - Security
  - UUID
---

*This post is part of a [collection on UUIDs](/uuid-collection/).*


Universally Unique Identifiers (UUIDs) are handy tool for a distributed systems architect.
The provide a method by which a distributed system can generate IDs without meaningful risk of duplicates.
These tools are very widely used and do their job quite well.

This post describes instances where UUID generation fails to provide uniqueness, known as a UUID collision.
This mystical event is mathematically so unlikely that you can often dismiss it in a hand-wave, yet collisions occur.

This post provides specific real-world examples of collisions and explains what went wrong.


## Real world collisions


### uuidjs and Math.random()

When using UUIDv4, you need to be sure that your random number generator is working properly.
If you use a weak source of entropy, you'll harm your collision resistance.
The UUID spec indicates that you SHOULD use a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) to mitigate this concern.
But it allows fallbacks when a CSPRNG is not available.

The JavaScript standard includes Math.random(), a simple random number generator.
Math.random() is not a secure random number generator and should not be used in security sensitive contexts.
But the quality of Math.random() output can be *surprisingly poor*, making it especially unsuitable for use in UUID generation.

There are several different JavaScript runtimes and each can implement Math.random() differently.
[This article](https://medium.com/@betable/tifu-by-using-math-random-f1c308c4fd9d)
describes collisions of randomized ID (although not UUIDs) when using the MWC1616 implementation in the V8 implementation of JavaScript.
The post describes real-world collisions and highlights how bad random number generators can be.
Thankfully, V8 has since switched xorshift128+, which produces better randomness.

A UUID implementation that was vulnerable to this issue was the 
[JavaScript uuid library](https://github.com/uuidjs/uuid)
(I'll call it uuidjs to avoid confusion).
uuidjs release before 7.0 would use a CSPRNG when available, but fall back to Math.random() otherwise.
This concern was disclosed as a security vulnerability [(CVE-2015-8851)](https://nvd.nist.gov/vuln/detail/CVE-2015-8851) and the fallback was removed.

But uuidjs users experienced an even worse class of collision.

GoogleBot, a JavaScript enabled web crawler, is [known to use](https://www.tomanthony.co.uk/blog/googlebot-javascript-random/)
an implementation of Math.random() that always starts from the same seed.
This is an intentional design decision by Google so that the crawler won't consider client-side dynamic content as a change to the underlying page content.

Some users of uuidjs found that [GoogleBot was sending network requests containing colliding UUIDs](https://github.com/uuidjs/uuid/issues/546#issuecomment-755287133).

If you search Google for the UUIDs listed in the bug report you'll find a diverse set of websites are impacted by this issue.

{{< figure
   src="/uuid-oops/UUID-collisions-in-google-search.png"
   alt="Google search results for '5f1b428b-53a5-4116-b2a1-2d269dd8e592' showing results from nhtsa.gov, usbank.com, and real estate websites"
   caption="UUIDv4 5f1b428b-53a5-4116-b2a1-2d269dd8e592 appears on many websites"
>}}

If you search for this UUID on other search engines you may only see the uuidjs issue (and perhaps this blog post).
This specific UUID is an artifact of how Google indexes web pages.

In summary, you may experience UUID collisions if your random number generator is a poor source of entropy.
Real world random number generators can be comically broken.


### Humans make mistakes

I accidentally experienced a UUID collisions when I was an intern.

I was writing some C++ code that defined a couple [COM objects](https://en.wikipedia.org/wiki/Component_Object_Model).
Each COM object needs to have a unique class ID (CLSID) and Microsoft uses a UUID for this (note: Microsoft calls them GUIDs).
The natural thing to do when creating yet another COM object is to copy the source code of an existing one.
I copy/pasted some code and forgot to change the CLSID, resulting in a collision.

Forgetting to change a hard coded UUID is a common issue, and not just for interns.
Users have found [BIOS UUID collisions](https://duckduckgo.com/?t=ftsa&q=03000200-0400-0500-0006-000700080009&ia=web)
for the ID "03000200-0400-0500-0006-000700080009".
The issue appears to be a hardware vendor that ships devices with this hardcoded UUID with the expectation that OEMs will change it.
The OEM doesn't change it, and users experience UUID collisions.

If you reuse a UUID, you're obviously going to have a collision.


### Malice

What if we introduce an adversary to the system?

If you accept UUIDs from outside your sphere of trust and control then you may encounter UUIDs that are generated with the intent of collision.
As my internship example shows, the attacker doesn't need to do anything complicated, they just send the same UUID twice.
Any client-side generation of UUIDs is at risk of this class of collision.

As always, use caution when handling untrusted data.


### Insecure hash functions

Unfortunately, UUIDv3 and UUIDv5 have not aged well.
These get their collision resistance entirely from cryptographic hash functions and the underlying functions have long been broken.

Historically, it made sense to think about MD5 and SHA-1 hashes as unpredictable values and you could model their collision resistance as random sampling (the birthday paradox again).
But once collisions could be forced, it was no longer safe to model them in that way.
A malicious user who can control the inputs to these hash functions could trigger a collision.

Since the UUIDv3 and UUIDv5 algorithms simply append the namespace to name, it's trivial to generate UUID collisions from existing hash collisions.
I haven't seen an example of this being demonstrated, so here goes.


**UUIDv3 collision example**

    from array import array
    from hashlib import md5
    from uuid import UUID, uuid3

    namespace = UUID('4dc968ff-0ee3-5c20-9572-d4777b721587')

    b1 = bytearray.fromhex('d36fa7b21bdc56b74a3dc0783e7b9518afbfa200a8284bf36e8e4b55b35f427593d849676da0d1555d8360fb5f07fea2')
    b2 = bytearray.fromhex('d36fa7b21bdc56b74a3dc0783e7b9518afbfa202a8284bf36e8e4b55b35f427593d849676da0d1d55d8360fb5f07fea2')
    # Different here ----------------------------------------------^ and here ----------------------------^

    print("Buffers are different: ", b1 != b2)

    H1 = uuid3(namespace, b1)
    H2 = uuid3(namespace, b2)

    print(H1)
    print(H2)
    print("UUIDs are the same:", H1 == H2)

This prints:

    Buffers are different:  True
    008ee33a-9d58-351c-beb4-25b0959121c9
    008ee33a-9d58-351c-beb4-25b0959121c9
    UUIDs are the same: True


**UUIDv5 collision example**

    from uuid import UUID, uuid5

    namespace = UUID("25504446-2d31-2e33-0a25-e2e3cfd30a0a")

    b1 = bytearray.fromhex('0a312030206f626a0a3c3c2f57696474682032203020522f4865696768742033203020522f547970652034203020522f537562747970652035203020522f46696c7465722036203020522f436f6c6f7253706163652037203020522f4c656e6774682038203020522f42697473506572436f6d706f6e656e7420383e3e0a73747265616d0affd8fffe00245348412d3120697320646561642121212121852fec092339759c39b1a1c63c4c97e1fffe017346dc9166b67e118f029ab621b2560ff9ca67cca8c7f85ba84c79030c2b3de218f86db3a90901d5df45c14f26fedfb3dc38e96ac22fe7bd728f0e45bce046d23c570feb141398bb552ef5a0a82be331fea48037b8b5d71f0e332edf93ac3500eb4ddc0decc1a864790c782c76215660dd309791d06bd0af3f98cda4bc4629b1')
    b2 = bytearray.fromhex('0a312030206f626a0a3c3c2f57696474682032203020522f4865696768742033203020522f547970652034203020522f537562747970652035203020522f46696c7465722036203020522f436f6c6f7253706163652037203020522f4c656e6774682038203020522f42697473506572436f6d706f6e656e7420383e3e0a73747265616d0affd8fffe00245348412d3120697320646561642121212121852fec092339759c39b1a1c63c4c97e1fffe017f46dc93a6b67e013b029aaa1db2560b45ca67d688c7f84b8c4c791fe02b3df614f86db1690901c56b45c1530afedfb76038e972722fe7ad728f0e4904e046c230570fe9d41398abe12ef5bc942be33542a4802d98b5d70f2a332ec37fac3514e74ddc0f2cc1a874cd0c78305a21566461309789606bd0bf3f98cda8044629a1')
    # Differences start here ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------^

    print("Buffers are different: ", b1 != b2)

    H1 = uuid5(namespace, b1)
    H2 = uuid5(namespace, b2)

    print(H1)
    print(H2)
    print("UUIDs are the same:", H1 == H2)


This prints:

    Buffers are different:  True
    f92d74e3-8745-57aa-b443-d1db961d4e26
    f92d74e3-8745-57aa-b443-d1db961d4e26
    UUIDs are the same: True


Credit goes to 
[Marc Stephens](https://marc-stevens.nl/research/md5-1block-collision/) for the underlying MD5 collision
and the authors of the
[SHATTERED paper](https://shattered.io/) for the underlying SHA-1 collision.


## Closing

UUID collisions are a fun topic because the first thing you learn about UUIDs is that they are guaranteed to be unique.
Looking at how UUIDs can collide in practice is a good overview of the sort of problems that pop up in software development.
Broken dependencies, error-prone developers, hard-coded values, weak cryptography, and malicious inputs are familiar dangers.

UUIDs are not immune.

