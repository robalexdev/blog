---
title: RSS Categories - In Practice
slug: rss-categories
date: 2024-06-06
summary: How do RSS Categories work in practice?
params:
  guid: f4b13a62-fcec-4729-a208-4a1f8312ba05
  categories:
  - RSS
  - Blogging
  - Taxonomies
---

I've been building a 
[directory of RSS feeds](https://alexsci.com/rss-blogroll-network/)
which has quickly grown to over a thousand feeds.
To build the directory, I wrote a web crawler
[(open source)](https://github.com/ralexander-phi/feed2pages-action)
which fetches each feed, parses it to collect metadata, identifies 
[OPML blogrolls](https://opml.org/blogroll.opml),
and spiders to each new feed it discovers.
I'm hopeful the directory will expand as more people adopt OPML for their blogrolls.

One challenge I needed to tackle was to figure out how the RSS (and Atom) spec is used in practice.
There's some instances where the spec is followed, some where the spec is vague, and others where the spec is not followed.
The category tags of RSS are a good example of this.

  
## The channel `<category>` element

The category element is an optional sub-element of the channel and item elements.
The spec for category is pretty short:

> `<category>` is an optional sub-element of `<item>`.

> It has one optional attribute, domain, a string that identifies a categorization taxonomy.
The value of the element is a forward-slash-separated string that identifies a hierarchic location in the indicated taxonomy. Processors may establish conventions for the interpretation of categories. Two examples are provided below:

> `<category>Grateful Dead</category>`

> `<category domain="http://www.fool.com/cusips">MSFT</category>`

> You may include as many category elements as you need to, for different domains, and to have an item cross-referenced in different parts of the same domain.

Right off the bat, we see *"Processors may establish conventions for the interpretation of categories"*.
So the spec doesn't have all the information we need to proceed.
With over a thousand feeds in my dataset, I decided to look at what conventions I could deduce.

A first observation was that `<category>` elements are rarely present for the channel.
Only about twenty in one thousand have any.
My blog didn't either... so I added one.
Channel categories would be really useful for navigating a large directory of feeds, but they are too rare.
Item categories, I.E. tags for individual posts, are more common with at least 25% of the feeds in my dataset using them.

Another observation was that the content of the category element isn't always intended for humans.
For example, one blog uses numbers in the category and another uses URI fragments.

One place where actual usage diverges from the spec is how forward slashes are used.
For example, a post with the category `A Noun A Verb And 9/11` should be interpreted as being about `11`, which is a subcategory of `A Noun A Verb And 9`.
But it's clearly not a subcategory.
I wasn't able to find any categories that were obviously using `/` as a subcategory separator.
I decided it would be best to assume that feeds don't follow the spec, and subcategories aren't a thing.
    
## Syndic8 and Taxonomies

You'll notice that the `domain` attribute from the example above looks like a URL.
However, the spec says that it's just a string and there's a comment at the end of the spec that explains this.
    
> In RSS 2.0, a provision is made for linking a channel to its identifier in a cataloging system, using the channel-level category feature, described above. For example, to link a channel to its Syndic8 identifier, include a category element as a sub-element of `<channel>`, with domain "Syndic8", and value the identifier for your channel in the Syndic8 database. The appropriate category element for Scripting News would be `<category domain="Syndic8">1765</category>`.

The Syndic8 database is defunct, but I was able to find an
[archived version](https://web.archive.org/web/20130124223347/http://www.syndic8.com/feedcat.php?Scheme=Syndic8#tabtable).
Here's the [link for Scripting News](https://web.archive.org/web/20130122111741/http://www.syndic8.com/feedinfo.php?FeedID=1765).
The Syndic8 page shows a few other categories being used: DMOZ, NewsIsFree (NIF), and TX.
Unfortunately, DMOZ shut down in 2017, NIF is currently full of affiliate links, and TX is too vague to identify.


> ![A screenshot of an archived syndic8.com page. Showing categories like Consumer (42), Culture (30), and Dow Jones 30 (29).](syndic8-cats.png)

> The archived syndic8 page.



Syndic8 was nowhere to be found in my dataset.
I turned to 
[sourcegraph.com](https://sourcegraph.com/)
to see if I could find an example.
This pointed to a 16-year-old 
[example file](https://github.com/nod/boombot/blob/master/plugins/Bible/docs/examples/rss20.xml):

    ...
    <category domain="Syndic8">1024</category>
    <category domain="dmoz">Top/Society/People/Personal_Homepages/P/</category>
    ...

Cool, that matches the RSS spec and shows how the forward-slash was intended to be used.
But I'm not seeing anything like that in use today.

The domain attribute in my dataset was rarely present.
When it was, it was always a URL.

      436 category domain="http://www.blogger.com/atom/ns#"
        7 category domain="https://ruk.ca/topics/travel/italy"
        7 category domain="https://ruk.ca/topics/travel"
        7 category domain="https://brainbaking.com/tags/metapost"
        5 category domain="https://ruk.ca/topics/sketch"
      ...

Awkwardly, the most commonly used URL, `http://www.blogger.com/atom/ns#`, throws a 404 error.
[An archive of the page](https://web.archive.org/web/20070221161648/https://www.blogger.com/atom/ns)
shows that this was previously a password protected API.
Blogger 
[deprecated this API](https://blogger-developers.googleblog.com/archives/atom-docs.html)
sometime around 2006.
Blogs hosted on blogger.com continue to use this value, although the meaning isn't defined in any of the docs (as far as I could find).
Kinda odd.

All of the others are URLs to a blog-specific categorization scheme.
If you open the URL you'll see all the posts on that blog in that category.
So the domain is usually a link to more content in that category.


## Podcast Categories

I noticed that 5% of the feeds were podcasts.
While podcasts use RSS for their format, they have a bunch of unique traits.
For one, iTunes defined the `<itunes:category>` element as the preferred way to set the category.
This element stores the category as an attribute.
Podcasts are required to have an `<itunes:category>`, so this is present in all the podcast feeds I've found.

There's too much detail in the iTunes docs to go into it, but I found it interesting that iTunes uses a
[fixed set of categories](https://podcasters.apple.com/support/1691-apple-podcasts-categories).
The categorization scheme is surprisingly small: only 120 categories.
Large directories can have a huge number of categories: defunct DMOZ had over a million.

The iTunes category system's small size makes it easy to assign a category for your podcast (iTunes only lets you pick one).
But it wouldn't be suitable for blogs, or the web in general, it's far too small.

## Un-taxonomy: the hashtag

Another interesting trend is the use of hashtags either as categories or in the description of a feed.
I don't see any evidence that RSS tools directly support hashtags, so this may be bleed over of users familiar with them on other platforms.
I was able to find around 700 examples of a hashtag being used in my dataset between categories.

There's no central authority on which hashtags should be used or what they mean.
This potentially fragments naming as different people will choose different hashtags for related topics, but it ends up working well in practice.
Writers gravitate towards popular hashtags to try to catch the attention of readers.
Readers flock to popular hashtags because they see those being used.
It's an organic approach that trends towards a common naming system without central authority.

Hashtags are sort of a good fit for RSS feed categorization.
The lack of a central authority matches the federated nature of RSS feeds.
When RSS was being developed, the idea that you could centrally define a taxonomy for the entire web was considered possible.
Today, few online directories exist and they are tiny compared to major search engine indexes.

    
## A path forward

My current approach is:

* Violate the RSS spec: don't treat forward-slashes as subcategory separators
* Use alternate categorization elements, like `<itunes:category>`
* Scan descriptions for hashtags, use these as categories if none were specified
* If a channel still doesn't have any categories, use the categories of the most recent post

Using this model, here's the most popular categories in my dataset:

     43 - Society &amp; Culture
     29 - Uncategorized
     24 - Technology
     14 - personal website and blog
     14 - News
     12 - books
     10 - advertising
      9 - radio
      8 - technology
      8 - Music
      8 - music
      8 - movies
      8 - history
      8 - Facebook
      7 - X-Men
      7 - TV
      7 - Thanksgiving
      7 - tech
      7 - poetry
      7 - Open Web
      7 - MTV
      7 - kids
      7 - Ireland
      7 - HBO
      7 - Canada
      7 - AI
      7 - activism
      6 - philosophy
      6 - Blog
      6 - Arts
      6 - art
      6 - Apple
      6 - ai
      5 - zoning
      5 - WordPress
      5 - Wonder Woman
      5 - wildlife
      5 - weddings
      5 - Valentine's Day
      5 - unicorns
      5 - Ukraine
      5 - UK
      5 - Tolstoy
      5 - spring
      5 - Seattle
      5 - Science
      5 - Sartre
      5 - San Diego
      5 - reading
      5 - rain
      5 - '#polycons'
      5 - polyamory
      5 - politics
      5 - podcasts
      5 - phones
      5 - parenting
      5 - New York
      5 - murder
      5 - merch
      5 - marriage
    ...

As expected, without a consistent taxonomy we have some duplicated elements, like Technology, technology, and tech.

You can see all the results at
[RSS Blogroll Network](https://alexsci.com/rss-blogroll-network/discover/)
