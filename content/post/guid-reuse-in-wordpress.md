---
title: GUID reuse in WordPress
date: 2026-03-29
slug: guid-reuse-wordpress
summary: Surprising collisions of WordPress post GUIDs
params:
  categories:
  - WordPress
  - UUID
---

{{< rawhtml >}}
<style>
figure {
    padding-left: 3em;
}

blockquote {
    border-left: 0.2em solid grey;
    padding: 0.2em 1em 0.2em;
    margin: 2em;
}

</style>
{{< /rawhtml >}}

I've recently started building a WordPress plugin, which is my first WordPress and PHP-based project.
I've programmed in a lot of different languages and platforms over the last twenty years, so picking up another is generally pretty straightforward.
I like expanding the breadth of my programming ability: last year I built [my first web browser extension](https://alexsci.com/blog/calm-tech-discover/) which I'm pleased to say has grown to 450 users across two browsers.

Switching between languages and frameworks teaches you common practices, and you tend to anticipate how things will work.
But every platform has it's own quirks and foot guns so you've got to watch out for bad assumptions.

This post explains why WordPress post GUIDs caught me by surprise.


## What is a GUID?

I first encountered [GUIDs through Microsoft](https://learn.microsoft.com/en-us/dotnet/api/system.guid) where they are essentially [RFC-9562](https://www.rfc-editor.org/rfc/rfc9562) Universally Unique Identifiers (UUIDs).
The most well-known UUID format is UUIDv4, which relies on 122 random bits.

    UUIDv4: 0e3c0cb9-1fcc-4cb2-b264-5677a5222567

UUIDs have strong uniqueness and collision avoidance properties, and programmers often assume those properties are strictly held.
I've [written too much about UUIDs already](https://alexsci.com/blog/categories/uuid/)
and I'm unfortunately very aware of [how UUIDs can collide in practice](https://alexsci.com/blog/uuid-oops/).

But WordPress GUIDs are not UUIDs and they behave very differently.
The most obvious difference is their structure, which is URL based.

    WordPress GUID: http://example.com/?p=123

Dispite appearances, WordPress post GUIDs are not collision resistant and I find myself unexpectedly adding another post to my [collection about UUIDs](https://alexsci.com/blog/categories/uuid/).
Alternate title: *If only WordPress used UUIDv4*.

## Diving into WordPress

As a newbie to WordPress I've found [WordPress Local](https://localwp.com/) to be a great developer tool.
I also tried [WordPress Studio](https://developer.wordpress.com/studio/), which claims [experimental Linux support](https://github.com/Automattic/studio/blob/trunk/docs/linux.md), but found the install was quite broken.
WordPress Local has been flawless and I was able to spin up a development site in about a minute.
Really impressive tooling.

Developing a plug-in means understanding the how WordPress handles requests.
It's a [sea of hooks](https://developer.wordpress.org/plugins/hooks/) you can plug into.
Diving into the WordPress code itself is really helpful to understand how things work.

I haven't been impressed with the WordPress docs; Django really spoiled me.

I'll also mention, I'm begrudgingly using Visual Studio Code even though [I usually prefer plain old vim](https://alexsci.com/blog/vim-over-vscode/).
WordPress Local has an easy path to connect XDebug to VS Code debugging which has been awesome for understanding how WordPress internals work.
I suspect I'll switch back to vim later, but who knows.


## WordPress GUIDs

The users of my plugin need to be able to manage individual posts across multiple WordPress sites they operate.
A GUID/UUID is a natural solution to this problem and I was happy to see that one was already available.
Unfortunately, this is the wrong direction.

Let's start with the [WordPress API docs](https://developer.wordpress.org/reference/functions/the_guid/).
These seem lackluster and only mention uniqueness guarantees by way of expanding the acronym.

> `get_the_guid( int|WP_Post $post ): string`
>
> Retrieves the Post Global Unique Identifier (guid).
>
> **Description**
>
> The guid will appear to be a link, but should not be used as an link to the post. The reason you should not use it as a link, is because of moving the blog across domains.

[The migration guide](https://developer.wordpress.org/advanced-administration/upgrade/migrating/#important-guid-note) gives us more information:

> The term “GUID” stands for “Globally Unique Identifier”. It is a field that is intended to hold an identifier for the post which a) is unique across the whole of space and time and b) never, ever changes. The GUID field is primarily used to create the WordPress feeds.
> 
> When a feed-reader is reading feeds, it uses the contents of the GUID field to know whether or not it has displayed a particular item before. It does this in one of various ways, but the most common method is simply to store a list of GUID’s that it has already displayed and “marked as read” or similar.

> This is why WordPress uses the permalink, or some form thereof, for the GUID.

One of my frustrations with the WordPress docs is the "or some form thereof" part of the description.
Why so vague?
Now I'm digging into the code to learn how this actually works.

One complication appears to be that WordPress has **two conflicting concepts** of "permalink".
The first is [`get_permalink`](https://developer.wordpress.org/reference/functions/get_permalink/), which is used to generate the GUID, as the docs hint.

> `get_permalink( int|WP_Post $post, bool $leavename = false ): string|false`
>
> Retrieves the full permalink for the current post or post ID.

The other is the "canonical URL" seen in [`get_page_link`](https://developer.wordpress.org/reference/functions/get_page_link/).
The canonical URL is an "aesthetically pleasing" URL which the site admin can customize via a settings page.

> `get_page_link( int|WP_Post $post, bool $leavename = false, bool $sample = false ): string`
>
> Retrieves the permalink for the current page or page ID.

It's very subtle, but the documentation is making an unexplained distinction between a "permalink" and a "full permalink".
This is a hazard for new developers who would assume there's only one permalink.

In any case, the default GUID typically generated using `get_permalink` relies on the domain name and the database auto-increment ID.
This seems quite reasonable as the domain name should be unique per website and the database auto-increment should not reuse IDs within a site.


## The problem

Unfortunately, it didn't take long for me to run into a GUID collision.
I needed to spin up a debugger to understand what was happening.

A post created via the WordPress editor is initially created as a draft, which is non-public.
It's GUID is generated by `get_permalink` which checks `wp_force_plain_post_permalink`.
Since the draft isn't public this triggers the "plain post permalink" code path.
It doesn't matter that the post was made public later, the GUID was already created and could not be changed.
This was working as I expected and these GUIDs appear collision avoidant.

However, I installed another plugin which my plugin needed to work along-side.
This plugin creates posts in a single pass, skipping the draft step.
When `get_permalink` runs it sees that the post is public and it decides that a "fancy permalink" is appropriate.
The default fancy permalink relies only on the post title, which does not have collision avoidant properties.

The fancy permalink format creates GUIDs like:

    WordPress GUID: http://example.com/post-title/


In particular, I was creating and trashing posts via the plugin; with many posts reusing previously used titles.
Since the titles were duplicates the GUIDs were duplicates.
With the trash enabled the posts were soft-deleted and still existed in the wp\_posts table, so the guid column had duplicates.
I could even restore these trashed posts, change their titles, and they'd continue using the colliding GUIDs.

Initially the plugin I'm developing assumed the GUID was a truly unique ID and I was using a [StackOverflow recommend custom SQL query](https://stackoverflow.com/a/27054880) to convert the GUID back to the post ID.
But since the GUID wasn't unique the query was returning multiple post IDs.

When I read that StackOverflow post I found myself wondering why WordPress lacked a built-in function to convert post GUIDs to post IDs.
Look-up by GUID is extremely common on other platforms.
But perhaps the non-uniqueness of these GUIDs is the reason: it wouldn't be a safe function to use.
Fifteen years ago there was [some discussion about adding an index to the guid column](https://core.trac.wordpress.org/ticket/18315), but the proposed patch adds "INDEX" not "UNIQUE", perhaps aware that adding UNIQUE would fail on some WordPress sites.
That ticket remains open.


## Not a bug

Surprised by WordPress's non-unique post GUIDs, I searched for an explanation.

The developer docs already explained that the GUID was "primarily used to create the WordPress feeds" and that feed readers use the GUID "to know whether or not it has displayed a particular item before".
The answer is right there, but it's subtle.
The post GUID doesn't uniquely identify the post, it uniquely identifies an item in a feed.
It's a presentation layer identifier, not a database level identifier.
The semantics are different than I expected.

Wrapping my head around this, the post GUID is really a **feed reader item ID** and **deduplication key** that ensures a consistent end-user understanding of post identity is maintained in the feed reader even when the post title, domain name, or other attributes change.
This even supports migrating to a different post in the database.
The lack of a uniqueness constraint in the database supports this.

This clicked for me, but perhaps I'd better explain.


## Feed reader perspective

I happen to have a collection of 22,000 web feeds for my [Blogroll Network Map](https://alexsci.com/rss-blogroll-network/) project.
About 10,000 feeds are "in the network" and [another 12,000 are excluded](https://alexsci.com/rss-blogroll-network/excluded/).
This collection is really helpful for understanding how feeds work in practice, as the corresponding specs aren't strictly followed.

I put together a quick script to extract the GUIDs from the RSS feeds.
This found around 120,000 GUIDs with 14,000 duplicates.
Many of the duplicated GUIDs were from non-WordPress sites.
However, examples like `https://notiz.blog/?p=48478`, with six occurrences, were WordPress based.
These items all link back to the same WordPress post, so these are not database-level duplicates, but I'll get there.


### Deduplication across feeds

In the notiz.blog example, there are many different feeds which publish the same content.
My network map collected all of these.

    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; Geburtstag Schlagwort Feed" href="https://notiz.blog/tag/geburtstag/feed/" />
    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; Journal Kategorie Feed" href="https://notiz.blog/category/journal/feed/" />
    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; notiz.blog Schlagwort Feed" href="https://notiz.blog/tag/notiz-blog/feed/" />
    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; notizblog Schlagwort Feed" href="https://notiz.blog/tag/notizblog/feed/" />
    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; Beiträge von Matthias Pfefferle-Feed" href="https://notiz.blog/author/matthias-pfefferle/feed/" />
    <link rel="alternate" type="application/rss+xml" title="notizBlog &raquo; Standard Post-Type-Feed" href="https://notiz.blog/type/standard/feed/" />

Notiz.blog has per-category and per-tag feeds.
A reader of this blog may wish to subscribe to multiple, perhaps "Geburtstag Schlagwort Feed" and "Journal Kategorie Feed".
Some blog posts, like the one mentioned earlier, will occur in both feeds.
The feed reader doesn't want to show this post twice, so it uses the RSS GUID element to deduplicate them.

The majority of duplicated GUIDs in my web feed collection appear to be due to this reason.


### Following sites that change domain names

Another use case of the RSS GUID element is to track posts as domain names change.
Blogs sometimes change domain names, and feed readers need to understand that the new links aren't new content.
The RSS GUID field supports that as well.

As one example, "adamnash.blog" used to be hosted at "blog.adamnash.com" and "psychohistory.wordpress.com".
[The feed](https://adamnash.blog/feed/) contains many item GUIDs with "blog.adamnash.com", suggesting they were created when that name was used, but have moved to the new domain name.
The GUID helps feed readers understand that the existing content was moved.


### Feed syndication

I keep forgetting, but the final "S" in RSS is for *syndication*.
RSS feeds can aggregate and re-publish the content of other websites.
One example of this is the [trending feed for Bear Blog](https://bearblog.dev/discover/).
Checking now, I see content from the following domain names:

* 4s.bearblog.dev
* blog.absurdpirate.com
* blog.lauramichet.com
* blog.mudflower.earth
* chronosaur.us
* commentingon.xyz
* jetgirl.art
* jotternook.bearblog.dev
* kyle.bearblog.dev
* nickhayes.bearblog.dev
* robertbirming.com
* sigkill.sh
* tomjohnell.com
* toska.bearblog.dev
* tuesdaynight.blog
* winther.sysctl.dk
* zeina.bearblog.dev
* zevvdaily.bearblog.dev

If you subscribe to both the Bear Blog trending feed and any of these feeds of those websites you probably only want to read each post once.
This duplicated GUID in https://robertbirming.com/feed/?type=rss and https://bearblog.dev/discover/feed/?type=rss lets your feed reader perform that deduplication:

    <guid isPermaLink="false">https://robertbirming.com/breader-bear-blog-reader/</guid>

There's lots of tools that support this form of syndication, many using the term [planet](https://indieweb.org/planet).

### WordPress syndication

Looping back to WordPress, lets look at [FeedWordPress](https://wordpress.org/plugins/feedwordpress/), a popular WordPress-based planet.
This plugin is popular, with over 10,000 installations.

The plugin allows you to select a collection of source web feeds from which it will import discovered items as WordPress posts.
This plugin creates posts that use a variant of the GUID found in the source feed.
FeedWordPress makes a bunch of changes to post GUIDs, including passing them through the md5 hashing function, so the final format is different than the original.
Here's one example:

    WordPress GUID: https://fwpplugin.com/?guid=c913601a75827d663a249487c52863a7

To confirm how the WordPress post GUID works I installed this plugin and imported two feeds that contained some duplicated posts.
FeedWordPress correctly generated the same GUID for the duplicated posts.
This meant that, at the presentation level, the feed reader wouldn't show these items as distinct posts.

Having seen duplicated GUIDs with a second WordPress plugin, I'm pretty comfortable with my updated understanding of how the WordPress post GUID works in practice.


## A documentation issue

I think my newbie expectation that the post GUID uniquely identifies the post in the database was reasonable.
I wouldn't necessarily say the WordPress documentation I read was wrong, but it missed an opportunity to explain something unexpected.
I've [filed a ticket to see if WordPress can document this](https://github.com/WordPress/Documentation-Issue-Tracker/issues/2216).


## Your test environment is my production environment

Another thing I try to keep in mind when programming is that my software often runs in other people's environments.
Sometimes that means a production environment, where I'd expect things like a delegated domain name.

Other times you're testing my product in your test environment, where things look wonky.
My software needs to work there too, otherwise I'll never reach your production environment.
Test environments can violate a ton of norms.
As a single example, test environments often use special-use domain names, perhaps under the .test or .local top-level domains.
The first WordPress site I created used the name "example.test" meaning the first WordPress post GUID I ever created was:

    WordPress GUID: http://example.test/?p=1

It's pretty obvious this isn't globally unique and I feel kinda silly that I ever thought otherwise.
If you've setup a test WordPress site before, there's a change you created a post with that ID as well.


## Early thoughts on WordPress

I'm enjoying how WordPress exposes hooks everywhere: it makes it possible to modify all sorts of site behaviors.
Plugins expose hooks of their own, so you can build plugins on plugins.
But the hook-based control flow can be surprising and it takes a lot of effort to understand what will happen if you change different things at different hook calls.
I suspect this gets easier the longer you work with the platform.

The GUID issue has unfortunately burned my trust.
If you're going to call something a globally unique ID make damn sure it's globally unique.
If it's only intended to define uniqueness in the context of a feed reader, document that limitation.
I shouldn't be running into GUID collisions in the first few weeks.

I'm left feeling wary about what other challenges exist in the WordPress codebase.

