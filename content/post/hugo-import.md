---
title: Moving to Hugo
slug: hugo-import
date: 2024-06-16
summary: My blog now uses the Hugo blog framework
params:
  categories:
  - Hugo
  - Blogging
---

I wrote my first blog post 10 years ago using Jekyll as a framework.
I didn't love the process.
It took quite a bit of work to get something I liked.
I felt like I was promised a quick-and-easy solution but found that I was sinking an unexpected amount of time into tweaking things.


## Plain HTML blogging

I recently started blogging again and chose to use plain HTML, without a framework.
This ended up clicking for me.
I found a small amount of CSS that got me something readable and then focused on writing.
Using `<p>`, `<h1>`, `<a>`, `<b>`, `<i>`, `<pre>`, `<img>`, `<li>`, and little else got me enough basic formatting.
When I occasionally wanted something more I had all of HTML at my disposal.
I've done enough web programming that HTML flows from my fingers, so while HTML more verbose than the Markdown equivalent, it doesn't impact writing speed for me.
I have long memorized HTML's `<img>` syntax while I need to remember how Markdown does images (`![alt text](path/to/image.png)`).
Plain HTML has fast cycle times since there's no build process to drop you out of flow.

If you've written HTML before then plain HTML blogging has zero learning curve relative to any framework you could choose.
This was surprising to me, as HTML seems strictly worse than Markdown for blogging, but it somehow made it easier to focus on content.
I think there's a few key things that made this approach work.
For one, I was starting from an empty blog, so I didn't need to worry about fancy features like tag clouds, pagination, or plug-ins.
Navigation would be simple, each post as a link to the homepage, and the home page links to each post in reverse chronological order.

I also wasn't too worried about each post having a consistent style.
I adopted an **archive-after-publishing** mentality, each post would be self-contained with it's own CSS, and I wouldn't worry if some old post looked different from the latest.


## The bad parts

The biggest pain points were keeping things in sync.
I had the title, publication date, and other metadata of each post duplicated in three places: the post itself, the homepage, and the RSS feed.
This was annoying, but solvable with a little vigilance to clean things up.

I discovered [h-feeds](https://indieweb.org/h-feed) recently, which could improve the situation.
Instead of maintaining a separate RSS feed you'd annotate your blog posts and listing with
[microformats](https://microformats.org/wiki/h-feed).
These would carry equivalent information to an RSS feed, and h-feed compatible feed readers would be able to process these web pages directly.
This keeps your blog [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself).
But support for h-feeds is lacking, so a "legacy" RSS feed is still highly desired.

## Migrating to Hugo

Why Hugo?

I've been using Hugo for a couple other static sites recently and I've really liked the way it works.
It's blazing fast to render a site, so it won't slow you down (this blog renders in 48ms).
The primitives you work with (layouts, partials, frontmatter) are productive.
There's a learning curve, but I paid that cost already, so Hugo was now at a very clear advantage.

My first plan was to drop all my old content under `static/` and just write new content.
This wouldn't quite work as Hugo was now in charge of my RSS feed and it wouldn't know about the old content.
A light alternative is to use a 
[Hugo shortcode](https://gohugo.io/content-management/shortcodes/)
to embed the original plain HTML for each post.
In the end I converted each post to Markdown manually keeping only small sections as unchanged plain HTML.
I broke my rule and tweaked the CSS for my older posts to bring them under a common theme.

An interesting side effect of this approach was that Hugo minified my old posts.
So my pages should now load slightly faster than before.

I needed to customize the RSS feed layout:

* I kept my original RSS feed's GUIDs, so my old posts hopefully didn't re-appear in your feed.
* I've added extra stuff like [the source:blogroll](https://alexsci.com/blog/blogroll-network/) element.

