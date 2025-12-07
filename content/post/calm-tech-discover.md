---
title: Discovering the indieweb with calm tech
date: 2025-12-06
slug: calm-tech-discover
summary: Blog Quest and StreetPass help you discover the independent web
params:
  categories:
  - RSS
  - Blogging
  - Calm Technology
---

When social media first entered my life, it came with a promise of connection.
Facebook connected college-aged adults in a way that was previously impossible, helping to shape our digital generation.
Social media was our super-power and we wielded it to great effect.

Yet social media today is a noisy, needy, mental health hazard.
They push distracting notifications, constantly begging us to "like and subscribe", and trying to trap us in endless scrolling.
They have become [sirens](https://en.wikipedia.org/wiki/Siren_(mythology)) that lure us into their ad-infested shores with their saccharine promise of dopamine.

{{< figure
  src="FacebookSiren.JPG"
  alt="The Siren (1888) by Edward Armitage with the text 'Connect with friends and the world around you on Facebook' added."
  link="https://commons.wikimedia.org/w/index.php?curid=6574249"
  title="Beware the siren's call"
>}}

How can we defeat these monsters that have invaded deep into our world, while still staying connected?


## StreetPass for Mastodon

A couple weeks ago I stumbled into a great browser extension, [StreetPass for Mastodon](https://streetpass.social/).
The creator, [tvler](https://mastodon.social/@tvler), built it to help people find each other on Mastodon.
StreetPass autodiscovers Mastodon verification links as you browse the web, building a collection of Mastodon accounts from the blogs and personal websites you've encountered.

StreetPass is a beautiful example of [calm technology](https://en.wikipedia.org/wiki/Calm_technology) .
When StreetPass finds Mastodon profiles it doesn't draw your attention with a notification, it quietly adds the profile to a list, knowing you'll check in when you're ready.

{{< figure
src="StreetPassPopup.png"
alt="A screenshot showing the StreetPass extension's popup window open. It lists several Mastodon profiles and the timestamps they were discovered"
>}}

StreetPass recognizes that there's no need for an immediate call to action.
Instead it allows the user to focus on their browsing, enriching their experience in the background.
The user engages with StreetPass when they are ready, and on their own terms.

StreetPass is [open source](https://github.com/tvler/streetpass) and available for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/streetpass-for-mastodon/), [Chrome](https://chrome.google.com/webstore/detail/streetpass-for-mastodon/fphjfedjhinpnjblomfebcjjpdpakhhn), and [Safari](https://apps.apple.com/us/app/streetpass-for-mastodon/id6446224821).

Inspired by StreetPass, I applied this technique to RSS feed discovery.


## Blog Quest

Blog Quest is a web browser extension that helps you discover and subscribe to blogs.
Blog Quest checks each page for auto-discoverable RSS and Atom feeds (using `rel="alternate"` links) and quietly collects them in the background.
When you're ready to explore the collected feeds, open the extension's drop-down window.

{{< figure
  src="BlogQuestPopup.png"
  alt="A browser extension popup showing several feeds it discovered"
>}}

The extension integrates with several feed readers, making subscription management nearly effortless.

Blog Quest is available for both [Firefox](https://addons.mozilla.org/en-US/firefox/addon/blog-quest/) and [Chrome](https://chromewebstore.google.com/detail/blog-quest/ghmfhadmoephkndjiahchiobgclmkkpi).
The project is [open source](https://github.com/robalexdev/blog-quest) and I encourage you to build your own variants.


## Ubiquitous yet hidden

I reject the dead Internet theory: I see a vibrant Internet full of humans sharing their experiences and seeking connection.
Degradation of the engagement-driven web is well underway, accelerated by AI slop.
But the independent web works on a different incentive structure and is resistant to this effect.
Humans inherently create, connect, and share: we always have and we always will.
If you choose software that works in your interest you'll find that it's possible to make meaningful online connections without mental hazard.

{{< rawhtml >}}
<br />
<br />
<small>
You can't drown out the noise of social media by shouting louder, you've got to whisper.
</small>
<br />
<br />
{{< /rawhtml >}}


### Image credits

* Edward Armitage: [The Siren (1888)](https://commons.wikimedia.org/w/index.php?curid=6574249)


