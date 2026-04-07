---
title: Uptime of GitHub Pages alternatives
date: 2026-03-26
slug: static-hosting-uptime
summary: Measuring service availability of static website hosting
params:
  categories:
  - Static Hosting
  - Reliability
  - GitHub
---

{{< rawhtml >}}
<style>
figure {
    padding-left: 3em;
}

</style>
{{< /rawhtml >}}

Many software developers feel we are at a software forge inflection point.
GitHub has reigned for over fifteen years, and we may be in the early days of an exodus.
Developers have become increasingly disappointed with GitHub's service, features, and overall direction.
Blame is often directed to the buy-out by Microsoft, migration to Azure, Azure itself, or the intense focus on AI.
Whatever the underlying reason, people are thinking about switching.

This post measures the static website hosting uptime of various alternatives.


## Why host websites from a forge?

First, a little background.

Many software forge providers support website hosting.
The core concept is that you can deploy a static website with little more than a git push.
The ease of use is central to this product: developers just want a static website with minimal fuss.
Since they already track their source code in a git repo, its easiest to launch a website from the same provider.
Ease of use was central to my decision to host this blog on GitHub Pages.

This post explores:

* [GitHub Pages](https://docs.github.com/en/pages)
* [Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/publishing-a-website-on-bitbucket-cloud/)
* [Codeberg Pages](https://docs.codeberg.org/codeberg-pages/); and
* [GitLab Pages](https://docs.gitlab.com/user/project/pages/)

All of these services provide a static website hosting free tier.


## Uptime monitoring

I wanted to understand the reliability of these services before I migrated my content, so I created a simple test.
I signed up for accounts on each service and deployed a test web page on each platform.
The web pages are completely static, so they can be served from disk as-is or from a CDN cache.
Finally, I created uptime monitors on [UptimeRobot](https://uptimerobot.com/?red=foxloo) to detect downtime of these test pages.

It's been running for almost two years.

The [monitoring status page is public](https://stats.uptimerobot.com/g9hjQmdr0w?red=foxloo), so you can track how well these platforms perform over time.

Here's the monitoring status for each platform over the last ninety days:

{{< figure
  src="uptime.png"
  alt="A monitoring page showing GitHub Pages: 100.000%; Bitbucket Cloud: 99.896%; Codeberg Pages: 98.012%; and GitLab Pages: 100.000%"
  link="https://stats.uptimerobot.com/g9hjQmdr0w?red=foxloo"
  title="Test webpage availability over the last 90 days"
>}}

Some quick notes about the monitoring.
Checks are performed at five minute intervals, so an outage that is shorter than that duration would either not be detected or would be reported as a five minute outage.


## GitHub Pages

The response timing for my test webpage on GitHub Pages was the best with an average response time over 100ms faster than all the others.
The minimum response time was 6ms, which suggests that UptimeRobot is in the same data center as GitHub Pages.

{{< figure
  src="github-timing.png"
  alt="Response time for the last two days was 136ms average; 558ms maximum; 6ms minimum"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803228?red=foxloo"
  title="GitHub Pages test webpage response times over the last two days"
>}}

My monitor detected three outages over the last 23 months.
Two were 404 Not Found errors, both happening on November 27th, 2024 and lasting ten minutes each.

There was also a five minute DNS-related outage.
GitHub was not to blame in this instance as I use a custom domain name and a third-party DNS provider.

{{< figure
  src="github-reasons.png"
  alt="List of downtime"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803228?red=foxloo"
  title="GitHub Pages test webpage downtime over the last 23 months"
>}}

Focusing on the last full year, 2025, there were zero outages I could attribute to GitHub Pages.
So my assessment of GitHub Pages test webpage uptime in 2025 is **100%**.

I was kind of surprised that GitHub Pages did so well here.
Microsoft's own status report shows occasionally issues with GitHub Pages.
My custom monitor did not detect these.

{{< figure
  src="github-pages-self-reported-status.png"
  alt="GitHub reports one red line and one orange line over the last 90 days"
  link="https://www.githubstatus.com/"
  title="Microsoft's reporting of GitHub Pages downtime over the last 90 days"
>}}

One explanation for the disagreement between these measurements is the presence of a third-party CDN.
[GitHub serves static assets for GitHub Pages through the Fastly CDN](https://www.fastly.com/customers/github).
I never change the test web pages, so I'm not testing the reliability of deployments.
So in this instance, my custom monitor is really measuring Fastly, not any Microsoft-operated systems.


## GitLab Pages

GitLab Pages was the slowest platform I tested, with average response times over 300ms slower than GitHub Pages.

{{< figure
  src="gitlab-timing.png"
  alt="Response time for the last two days was 496ms average; 2488ms maximum; 355ms minimum"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803275?red=foxloo"
  title="GitLab Pages test webpage response times over the last two days"
>}}

GitLab had one large outage of twenty-five minutes and a short five minute outage.

{{< figure
  src="gitlab-reasons.png"
  alt="List of downtime"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803275?red=foxloo"
  title="GitLab Pages test webpage downtime over the last 23 months"
>}}

GitLab Pages appeared to have **99.994% uptime** in 2025.
This "four-nines" availability is excellent and is suitable for most websites.


## Bitbucket Cloud

Bitbucket Cloud response times were middle-of-the-road.

{{< figure
  src="bitbucket-timing.png"
  alt="Response time for the last two days was 328ms average; 1056ms maximum; 173ms maximum"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803402?red=foxloo"
  title="BitBucket Cloud test webpage response times over the last two days"
>}}

UptimeRobot detected twenty-eight periods of downtime for the Bitbucket Cloud test webpage.
Nineteen of these were connection timeouts.
The rest were 500-series HTTP status codes.

{{< figure
  src="bitbucket-reasons.png"
  alt="List of downtime"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803402?red=foxloo"
  title="Partial list of GitLab Pages test webpage downtime"
>}}


{{< figure
  src="bitbucket-down-longest.png"
  alt="Down for 3 hours, 16 minutes. The reason was Connection Timeout"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803402?red=foxloo"
  title="The longest outage lasted over three hours."
>}}

Over 2025, the Bitbucket Cloud test webpage availability was measured as **99.936% uptime**.
This "three-nines" availability is excellent and is suitable for most websites.


## Codeberg Pages

The Codeberg Pages test webpage had the second fastest response times.

{{< figure
  src="codeberg-timing.png"
  alt="Response time for the last two days was 289ms average; 7042ms maximum; 56ms minimum"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803395?red=foxloo"
  title="Codeberg Pages test webpage response times over the last two days"
>}}

The Codeberg Pages test webpage had the worst availability with 489 periods of downtime.
The longest of these nearly reaching seventeen hours.

{{< figure
  src="codeberg-reasons.png"
  alt="List of downtime"
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803395?red=foxloo"
  title="Partial list of Codeberg Pages test webpage downtime"
>}}

{{< figure
  src="codeberg-down-longest.png"
  alt="Down for 16 hours, 57 minutes. The reason was Bad Gateway 402."
  link="https://stats.uptimerobot.com/g9hjQmdr0w/796803395?red=foxloo"
  title="The longest outage lasted almost 17 hours."
>}}

Over 2025, the Codeberg Pages test webpage availability was measured as **98.358%**.
This "one-nine" uptime is below availability targets of many websites.


## Closing thoughts

GitHub Pages took the top spot in this analysis, which wasn't what I expected.

Depending on your sensitivity to slow response times and availability, you may rank GitLab Pages or Bitbucket Cloud as the best alternative.
It seems reasonable to measure GitLab Cloud latency from other locations, as the slow response times could be an artifact of the network path between GitLab and UptimeRobot.

Codeberg Pages had the worst availability and appears unsuitable for all but the most outage tolerant of websites.
If you need to use it, you could add a CDN of your own on top.
Many CDNs are able to serve your websites even when the origin is down, thus hiding availability problems.
This adds additional complexity, can impact privacy, and may carry extra costs.

{{< rawhtml >}}
<p>
<small>
This post includes affiliate links to UptimeRobot.
</small>
</p>
{{< /rawhtml >}}


