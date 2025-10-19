---
title: Why UUIDs won't protect your secrets
date: 2025-10-19
slug: uuids-and-idor
summary: UUIDs and Indirect Object Reference
params:
  categories:
  - Security
  - UUID
---

*This post is part of a [collection on UUIDs](/uuid-collection/).*

## What is IDOR?

Indirect Object Reference (IDOR) occurs when a resource can be accessed directly by its ID even when the user does not have proper authorization to access it.
IDOR is a common mistake when using a separate service for storing files, such as a publicly readable Amazon S3 bucket.
The web application may perform access control checks correctly, but the storage service does not.

Here's vulnerable Django code which allows a user to view their latest billing statement:

    # Vulnerable!
    @login_required
    def view_latest_bill(request):
        bill = Bill.objects.filter(owner=request.user).order_by("date").desc()[0]
        url = f'https://example.us-east-1.s3.amazonaws.com/bill-{bill.id}'
        return render(request, 'template.html', { url: url })

While Django ensures the user is logged in and only provides them with bills they own, S3 has no concept of Django users, and performs no such authorization checks.

A simple attack would start from a known URL and increment the bill ID:

    $ curl https://my-bucket.us-east-1.s3.amazonaws.com/bill-100
    [ attacker sees their own bill ]
    $ curl https://my-bucket.us-east-1.s3.amazonaws.com/bill-101
    [ attacker sees another user's bill ]

The attacker can keep trying bill IDs, potentially accessing the entire collection of bills.


## UUIDs to the rescue?

What if we changed the Django model to use UUIDs for the primary key instead of an auto-increment?
The new URLs will look like: my-bucket.us-east-1.s3.amazonaws.com/bill-9c742b6a-3401-4f3d-bee7-6f5086c6811f.
UUIDs aren't guessable, so the attacker can't just "add one" to the URL to access other user's files, right?

     class Bill(models.Model):
    -    id = models.AutoField(primary_key=True)
    +    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

Unfortunately, this is only a partial fix.

Even when URLs are unguessable, that doesn't mean an attacker can't learn them.
A classic example starts with a former employee who used their personal computer for work.
Hopefully their user account was quickly disabled, blocking them from accessing the company's web application.
But sensitive URLs may still exist in their browser history.
Even a non-technical attacker can pull off this attack, just by clicking through their browser history.
Thankfully, many companies require employees to use company-issued devices when performing work, so this attack may be limited to former employees who violated that rule.

The accidental leaking of URLs is probably a more reasonable concern.
For example, if only managers are authorized to view bills you need to be careful not to leak the bill ID in other views where other employees have access.

If you use secret UUIDs, think of them as toxic assets.
They taint anything they touch.
If they end up in logs, then logs must be kept secret.
If they end up in URLs, then browser history must be kept secret.
This is no small challenge.

Another concern for leaked UUIDs is rotation.
Whenever a secret key is compromised, leaked, or known to have been stored improperly, it should be changed.
The same holds true for secret URLs.
Make sure you have a way to rotate secret URLs, otherwise you may end up stuck in a compromised state.
Again, no small challenge.

If this sounds like a huge pain... it is. Let's find a better solution.


## Properly fixing IDOR

The best approach is to ensure every request for sensitive data is authorized.

One fix is to route file access through the web application.
Continuing our example, the user would access /api/bill/100 and the file would be streamed from the storage through the web app to the user's browser.
If the user tries to access /api/bill/101, where they lack authorization, the web application can deny the request.
Make sure the storage bucket is private, such that access must route via the web app.

This approach is a good quick fix, but there are other approaches to consider.

If your storage provider is Amazon S3 you should consider [pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).
These URLs allow the browser to download the file directly from S3, without streaming through the web app.
The URL contains a cryptographic signature with a short expiration date.
These URLs are still sensitive, but the short expiration mitigates a number of concerns.
Again, make sure the storage bucket is private.

A key benefit of the pre-signed URL approach is that it offloads file access from your web application, reducing load on the application server.


## Case study: YouTube unlisted content

Let's consider a well-known application that doesn't follow this advice.

YouTube, a popular video hosting service, allows uploaders to mark videos as "unlisted".
This is a compromise between public and private.
The owner of the video can copy their video's URL and share it out-of-band, like in a private chat room.
This way, people in the private chat room can view the video, but the owner doesn't need to grant them access one-at-a-time and the viewers don't need to log in.
In essence, anyone who knows the URL is considered authorized from YouTube's perspective.

{{< figure
  src="/uuids-and-idor/YouTube-unlisted.png"
  alt="A radio control based form with the following text. Visibility. Choose when to publish and who can see your video. Save or publish. Make your video public, unlisted, or private. Private. Only you and people you choose can watch your video. Unlisted. Anyone with the video link can watch your video. Public. Everyone can watch your video."
  caption="YouTube visibility selection"
>}}

This approach uses unguessable URLs, which contain a random video ID, like `ibF36Yyeehw`.
This appears to be 11 random alphanumeric characters, which offer around 64 bits of entropy.
This is suitably unguessable, but the security is questionable.

Once the URL is shared with others, the owner loses the ability to assert access control over the video.
An authorized viewer can choose to share the URL with others.
Users may expect that the video has proper access control restrictions and share the URL in a public-facing document, not realizing that leaking the URL leaks the video.

Consider unlistedvideos.com, an index of unlisted YouTube videos.
Users who discover unlisted videos can upload those URLs to the site, thus leaking the content to a broad audience.
The large number of videos listed on the site shows the poor access control properties afforded by this access control method.

If your unlisted content leaks to unauthorized viewers, you can regain control by marking the video as private.
This prevents anyone from accessing the video, until you grant their account access.
Of course, you probably chose to make the video unlisted to avoid needing to manage individual account access.
You could also try re-uploading the video, marking it as unlisted, and sharing the new link, but the risk of a subsequent leak remains.

Another example of this design appears later in this blog post, AWS billing estimates.
AWS appears to use 160 bits of entropy to protect these URLs.
Here's the verbiage AWS uses when you create a share link.

{{< figure
  src="/uuids-and-idor/AWS-unlisted-urls.png"
  alt="A dialog box containing the following text. Public server acknowledgment: Your data will be stored on AWS public servers. The calculator will generate an obscure, but publicly accessible URL. Anyone with the public share link will be able to access your estimate."
  caption="AWS billing share dialog"
>}}

Interestingly, I'm not seeing a way to delete a billing estimate once shared.
The creator appears to lose all ability to manage access once the link is shared outside their sphere of control.
Be very careful not to put sensitive data in your billing estimates.

Unlisted content is an example of IDOR as an intentional security design.
The uploader is expected to decide if unlisted offers the right security posture for their content.
There are use cases where the effort needed to individually grant users access outweighs the risk of using unlisted.
Not everyone is dealing in highly sensitive content, after all.


## Are UUIDs unguessable?

OK, maybe you want to create something like YouTube unlisted content, despite these concerns.
In that case, we should ignore security concerns related to "leaked URLs" as that is "by design".
Unlisted URLs are sort of like bearer tokens or API tokens which grant access to a single resource.
Let's focus on attacks that guess URLs and consider how guessable UUIDs actually are.

UUIDv4 contains 122 random bits, much more than the 64 bits of a YouTube video ID, so there's little to contest about UUIDv4 guessability.

But what about newer formats like UUIDv7?

UUIDv7 embeds a timestamp at the start such that the IDs generally increase over time.
There's some claimed benefits, such as improved write performance for certain types of databases.

Unfortunately, the timestamp makes UUIDv7s easier to guess.
The attacker needs to figure out the timestamp and then brute-force the random bits.
Learning the timestamp may not be that difficult: users sometimes have access to metadata for resources they don't have full permission to access.

In our "latest bill" example, the bills are probably generated by a batch job kicked off by cron.
As such, the bills are likely created one after another in a narrow time period.
This is especially true if the attacker has the UUID of their own bill as a reference.
An attacker may be able to guess a small window around when the target object's UUID was created.

Other UUID generation methods recommend creating UUIDs in large batches and then assigning them to resources, in order, as resources are created.
With this approach, the UUID timestamp is loosely correlated with the resource creation timestamp, but doesn't contain a high precision timestamp for the resource creation.
This mitigates some classes of information leakage related to timestamps.
Unfortunately, it also bunches UUIDs together very tightly, such that many IDs will share the exact same timestamp.
Learning one UUID leaks the timestamp of the entire batch.

At first glance, the random bits seem to save us.
There are still 74 random bits in a UUIDv7; still more than a YouTube video ID.
That's 2^74^ possible random suffixes (18,889,465,931,478,580,854,784).
Well beyond what an attacker can reasonably brute-force over the Internet.

I would end the blog post here, but UUIDv7 offers additional optional methods which we need to consider.
The spec allows [monotonic counters](https://www.rfc-editor.org/rfc/rfc9562.html#name-monotonicity-and-counters)
to be used when multiple UUIDs are created within the same timestamp.
This ensures that IDs created by a single node are monotonically increasing, even within a single millisecond.
The first UUID in a given timestamp uses a randomized counter value.
Subsequent IDs in the same millisecond increment that counter by one.

When the counter method is used, an attacker who learns one UUIDv7 can predict the counters of neighboring IDs by adding or subtracting one.
A random suffix still exists, and that would still need to be brute-forced.

Of note for Django users, Python 3.14 introduced UUIDv7 in the standard library.
[Python uses a 42-bit counter](https://github.com/python/cpython/blob/18dfc1d6c4ba9e1cc8fd5c824095abc9bf6918c6/Lib/uuid.py#L850),
which is the maximum width the spec allows.
That means Python's UUIDv7 only has 32 random bits, offering only 2^32^ possible random suffixes (4,294,967,296).


## How much security does 2^32^ offer?

Four billion seems like a big number, but is it large enough?

On average, this is 1,657 request per second averaged over a month.
Is that possible?

S3 claims it will automatically scale to "at least 5,500 GET requests per second".
On the attacker side, HTTP load testing tools easily scale this high.
k6, a popular load testing too, suggests using a single machine unless you need to exceed 100,000 request per second.
The attack fits within the systems limits and appears feasible.

Adding a rate limiter would force the attacker to distribute their attack, increasing attacker cost and complexity.
Cloud providers like Amazon S3 don't offer rate limiting controls so you'll need to consider a WAF.
This changes the user-facing URL, so adding a WAF may break old URLs.

There's cost asymmetry here too.
An attacker who guesses 2^32^ S3 URLs will cost your service at least [$1,700 on your AWS bill](https://calculator.aws/#/estimate?id=abe9e172e0a468c7b310ad744e136446353f2a8f).
If you don't have monitoring set up, you may not realize you're under attack until you get an expensive bill.
The attackers cost could be as low as a single machine.

I'm uneasy about the security here, as the attack appears technically feasible.
But the attack doesn't seem very attractive to an attacker, as they may not be able to target a specific resource.

An application that had juicy enough content to be worth attacking in this way would probably worry about "URLs leaking".
In that case, unlisted URLs are a poor fit for the product and the fixes listed earlier should be used.
Which renders the entire point moot as you should never end up here.

But it's not an entirely theoretical concern.
If you search on GitHub, you can find examples of applications that use UUIDv7 IDs and the "public-read" ACL.
The sensitivity of the data they store and the exact UUIDv7 implementation they use varies.

Nevertheless, 32 random bits is too small to be considered unguessable, especially for a cloud service like S3 which lacks rate-limit controls.


## UUIDv7 for internal-only IDs

A common theme of UUIDv7 adoption is to avoid exposing the IDs publicly.
One concern driving this trend relates to IDs leaking timing information, which can be sensitive in certain situations.

A simple approach uses a random ID, perhaps UUIDv4, as the external ID and UUIDv7 as the database primary key.
This can be done using a separate database column and index for the external ID.

Another intriguing approach is [UUIDv47](https://github.com/stateless-me/uuidv47) which uses SipHash to securely hash the UUIDv7 into a UUIDv4-like ID.
SipHash requires a secret key to operate, so you'll need to manage that key.
Unfortunately, rotating the key will invalidate old IDs, which would break external integrations like old URLs.
This may prevent systems from changing keys after a key compromise.
Caveat emptor.

Either of these approaches could help in our "unlisted URLs with UUIDv7" example.


## Postgres UUIDv7 generation

Postgres currently uses the "replace leftmost random bits with increased clock precision" method when generating UUIDv7 IDs.
Postgres converts 12 of the random bits into extra timestamp bits.
This means Postgres UUIDv7 timestamps have nanosecond granularity instead of millisecond.
As such, Postgres UUIDv7s have 62 random bits, in the current implementation.

So when it comes to UUIDv7 guessability, it really depends on what optional methods the implementation chooses.


## Closing

Be careful when adopting newer UUID versions as the properties and trade-offs are distinct from earlier versions.

The authors of UUIDv7 knew about these guessability concerns and discuss them in RFC 9562.
The spec offers a "monotonic random" counter method, which increments the counter by a random amount instead of one.
While their solution would help mitigate this attack, I wasn't able to find an implementation that actually uses it.


## References

* [RFC 9562: Universally Unique IDentifiers (UUIDs) (2024)](https://datatracker.ietf.org/doc/rfc9562/)
* [Python uuid.uuid7](https://docs.python.org/3/library/uuid.html#uuid.uuid7)
* [100,000,000 S3 requests per day](https://medium.com/@maciej.pocwierz/how-an-empty-s3-bucket-can-make-your-aws-bill-explode-934a383cb8b1)
* [k6 load generator](https://grafana.com/docs/k6/latest/testing-guides/running-large-tests/)
* [UUIDv47](https://github.com/stateless-me/uuidv47)
* [Postgres UUIDv7 generator](https://github.com/postgres/postgres/blob/dd766a441d69d16d1c8ab0d3a41a10649702d202/src/backend/utils/adt/uuid.c#L601)

