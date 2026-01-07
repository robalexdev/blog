---
title: RSS feed discovery with FeedLand
date: 2026-01-07
summary: FeedLand enables social blog discovery
params:
  categories:
  - Blogging
  - RSS
---

{{< rawhtml >}}
<style>
blockquote {
    border-left: 0.2em solid #77d;
    padding: 0.2em 0.8em;
    margin: 3em;
}
</style>
{{< /rawhtml >}}

This blog post explores [FeedLand.com](https://feedland.com/), an RSS feed reader with unique social elements.


> The goal of FeedLand is to make news a social thing, following the pattern of social media apps, but using open formats and protocols.
> --- [Getting started with FeedLand](https://docs.feedland.com/gettingstarted.md)


I've been using FeedLand as my feed reader since 2024.
I'll admit that I don't love the UX, its got some quirks, but the clever design keeps me coming back.

What makes FeedLand unique?


## Open subscription lists

The list of feeds you subscribe to on FeedLand are public.
It may seem like a minor change, but this is the core of what makes FeedLand social.

For example, [the feeds I subscribe to](https://feedland.com/?username=robalexdev) are listed on this page:

{{< figure
src="subscriptions.png"
alt="A screenshot of a web page showing a list of blog titles"
link="https://feedland.com/?username=robalexdev"
title="My subscriptions"
>}}

If you like reading what I write on this blog, you may also like *reading the things I read*.
This "social proof" is a valuable way for others to expand their own subscriptions.

You can even [step into my news feed](https://feedland.com/?river=true&screenname=robalexdev) and see the same posts I see:

{{< figure
src="my-news.png"
alt="A screenshot of a web page showing a couple blog post titles, initial content, and interaction buttons"
link="https://feedland.com/?river=true&screenname=robalexdev"
title="My news feed"
>}}

I think this is a novel concept; I don't think any other social media platform lets you browse from other user's perspectives.
This alone is worthy of a blog post.

FeedLand doesn't stop there, you can also see [FeedLand users who subscribe to my blog](https://feedland.com/?feedurl=https%3A%2F%2Falexsci.com%2Fblog%2Frss.xml) on this page:

{{< figure
src="who-reads-my-blog.png"
alt="A screenshot of a web page showing metadata about a blog, including links to seven subscribers"
link="https://feedland.com/?feedurl=https%3A%2F%2Falexsci.com%2Fblog%2Frss.xml"
title="FeedLand users that follow my blog"
>}}

And you can click into the subscription lists of each of my subscribers to learn what [other blogs they follow](https://feedland.com/?username=reenum).

{{< figure
src="another-feed.png"
alt="A screenshot of a web page showing a list of blog titles"
link="https://feedland.com/?username=reenum"
title="Subscriptions of a FeedLand user who follows my blog"
>}}

I can also explore starting from my own subscription list, finding other FeedLand users who read my favorite blogs, and seeing what else they read.


FeedLand is a great example of social networking without "The Algorithm".
It has powerful tools to help you explore, but you stay in control of what you see and how you browse.
You can walk the network graph of blog subscriptions in the same way you'd browse "friend links" on other social media sites.
In fact, I discovered many of my own subscriptions by observing who else reads the blogs I enjoy and browsing their subscriptions.


## Blogrolls and OPML

Bloggers have a long tradition of promoting other blogs, often via blogrolls.
The exact format varies from [Juhis's well-curated blogroll](https://hamatti.org/blog/roll/), which thoughtfully explains why you'd be interested in each blog, to many nondescript pile-of-links.

Blogrolls have a tendency to grow stale if you don't maintain them.
Synchronizing your blogroll against your feed reader subscriptions is one solution, and FeedLand can provide you with a single-source-of-truth.
There are many blogroll integrations with FeedLand, like 
[this JavaScript one](https://blogroll.social/) 
and my own 
[my own](https://alexsci.com/feeds/following/) that uses a GitHub action.

FeedLand isn't Hotel California, it's full of RSS feeds and OPML subscription lists you can download.
So even if you don't read your news feed in FeedLand, it's a valuable discovery engine.


## Decentralized, social feed reading

FeedLand leans in to open protocols and formats.

I've blogged about the [source:blogroll RSS element](https://alexsci.com/blog/blogroll-network/) before, so I won't fully rehash it here, but FeedLand and [Micro.blog](https://micro.blog/) are building smart innovations on the independent web.
The source:blogroll RSS element allows a feed to link to an OPML blogroll, forming an auto-discoverable, machine parsable network of blog subscriptions.

This idea can help democratize blog discovery into increasingly user friendly methods (including algorithmic discovery).
As feed readers adopt the standard you'll be able to navigate blogrolls as seamlessly as Mastodon manages user profiles.


## How I use FeedLand

I enjoy checking my news feed daily but I'm wary of getting sucked into an endless feed.
As such I don't subscribe to any feeds that post more than once per day and most of the feeds I subscribe to publish quite rarely.
This provides a great filter: if you're posting many times per day then you're not putting much effort into each post.
"Engagement farming" will result in an unsubscribe from me.

I've been mindful to try to read more medium- to long-form content.
The world seems bent on moving to ever-shorter content, but I'm not interested.
I'm also not interested in seeing political news in my feed reader, I approach political news in a different way.

I've found that feeds with high subscriber counts are often major news networks or have lots of content.
I like to dive into the low-subscriber-count blogs, which are often newer bloggers or people who only post when they have something really interesting to say.
These people are least likely to be engagement farming.
Green links are feeds that were originally added to FeedLand by this user; another strong signal to consider a feed.

Using this approach my subscription list has grown to 106 feeds, yet I only see a couple posts per day.
Many of of the blogs I subscribe to haven't posted in over a year, but I trust they'll write something awesome when they finally do!

In one of my previous posts I mentioned that ["I see a vibrant Internet full of humans sharing their experiences and seeking connection"](https://alexsci.com/blog/calm-tech-discover/#ubiquitous-yet-hidden).
You can easily fill your feed reader with click-bait junk, but I've managed to dodge this with my approach.


## Closing

Thus far, I'm only using a small part of FeedLand, but there's quite a bit here.
It integrates with several external tools, like link bloggers.
You can even use FeedLand as a micro-blog.

The FeedLand community feels small but is active enough to provide "network effects".
The project is [open source](https://github.com/scripting/feedland) and under active development.
I'm eager to see how the vision grows.

