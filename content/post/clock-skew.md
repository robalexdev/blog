---
title: Does the Internet know what time is it?
date: 2025-12-24
slug: clock-skew
summary: Measuring out-of-sync clocks on the Internet
params:
  categories:
  - Time
  - Measurement
---

{{< rawhtml >}}
<style>
blockquote {
    font-style: italic;
}
</style>
{{< /rawhtml >}}

Time is one of those things that is significantly harder to deal with than you'd naively expect.
Its common in computing to assume that computers know the current time.
After all, there are protocols like NTP for synchronizing computer clocks, and they presumably work well and are widely used.
Practically speaking, what kinds of hazards lie hidden here?

I'll start this post with some questions:

* How often are computer clocks set to the wrong time?
* How large do these offsets grow?
* Can we model clock offsets, and make predictions about them?
* Are out-of-sync clocks a historical concern that we've largely solved, or is this still a concern?

{{< figure
    src="whattimeisitrightnow.png"
    alt="A screen shot showing whattimeisitrightnow.com and time.gov websites side-by-side. The former shows a timestamp one second behind the latter."
    title="A well-timed screen grab shows slight offset between popular clock websites"
    link="whattimeisitrightnow.png"
>}}

Some quick definitions:

* *Clock skew*: the rate at which a clock deviates from a one-second-per-second standard, often measured in parts per million
* *Clock offset*: the difference between the displayed time and Coordinated Universal Time (UTC), often measured in seconds

I just checked the system time of my laptop against [time.gov](https://www.time.gov/), which reports a -0.073s offset.
So for a N=1 sample size, I'm cautiously optimistic.

There are research papers, like [Spanner, TrueTime & The CAP Theorem](https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/45855.pdf),
that describe custom systems that rely on atomic clocks and GPS to provide clock services with very low, bounded error.
While these are amazing feats of engineering, they remain out of reach for most applications.

What if we needed to build a system that spanned countless computers across the Internet and required each to have a fairly accurate clock?
I wasn't able to find a study that measured clock offset in this way.
There are, however, a number of studies that measure clock *skew* (especially for fingerprinting).
Many of these studies are dated, so it seems like now is a good time for a new measurement.

This post is my attempt to measure clock offsets, Internet-wide.


## HTTP Date header

When processing HTTP requests, servers fill the [HTTP Date header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Date).
This header should indicate "the date and time at which the message originated".
Lots of web servers generate responses on-the-fly, so the Date header reveals the server's clock in seconds.

    $ curl -v https://wikipedia.com 2>&1 | grep -i "< Date:"
    < date: Thu, 23 Oct 2025 23:59:35 GMT
    $ date --utc
    Thu Oct 23 11:59:36 PM UTC 2025

Looks pretty good.
I'll use this as the basis for the measurements.
Unfortunately, there are a bunch of challenges we'll need to deal with.

First, resources may get cached in a CDN for some time and the Date header would reflect when the resource was generated instead of the server's current time reference.
Requesting a randomized path will bypass the CDN, typically generating a 404 error.
Unfortunately, I found some servers will set the Date header to the last modified time of the 404 page template.
I considered performing multiple lookups to see how the Date header advances between requests, but some websites are distributed, so we'd be measuring a different system's clock with each request.
The safest way to avoid this hazard is to only consider Date headers that are offset to the future, which is the approach we'll use.

HTTP responses will take some time to generate; sometimes spanning a couple seconds.
We can't be sure when the Date header was filled, but we know it was before we got the response.
Since we only want to measure timestamps that are from the future, we can subtract the timestamp in the date header from when we received the response.
This gives a lower bound for the underlying clock offset.

When performing broad Internet scans you'll find many servers have invalid or expired TLS certificates.
For the sake of collecting more data I've disabled certificate validations while scanning.

Finally, our own system clock has skew.
To minimize the effect of local clock skew I made sure I had a synchronization service running (systemd-timesyncd on Debian) and double checked my offset on time.gov.
All offset measurements are given in whole seconds, rounding towards zero, to account for this challenge.

The [measurement tool](https://github.com/robalexdev/internet-clock-skew-scanner) is mostly a wrapper around this Golang snippet:

    u, err := uuid.NewRandom()
    if err != nil {
      die(err)
    }
    req, err := http.NewRequest("HEAD", fmt.Sprintf("https://%s/%s", domain, u.String()), nil)
    if err != nil {
      die(err)
    }
    req.Header.Add("User-Agent", "https://github.com/robalexdev/internet-clock-skew-scanner")
    startTs := time.Now().Unix()
    resp, err := httpClient.Do(req)
    endTs := time.Now().Unix()

For performance reasons, the code performs a HTTP HEAD request instead of the heavier GET request.


### Measurements

Starting in late-November I scanned all domain names on the 
[Tranco top 1,000,000 domains list (NNYYW)](https://tranco-list.eu/list/NNYYW/1000000).
I scanned slowly to avoid any undesired load on third-party systems, with the scan lasting 25 days.

Of the million domain names, 241,570 systems could not be measured due to connection error such as timeout, DNS lookup failure, connection refusal, or similar challenges.
Not all the domains on the Tranco list have Internet-accessible HTTPS servers running at the apex on the standard port, so these errors are expected.
Further issues included HTTP responses that lacked a Date header (13,098) or had an unparsable Date header (102).
In all, 745,230 domain names were successfully measured.

The vast majority of the measured domains had an offset of zero (710,189; 95.3%).
Date headers set to the future impacted 12,717 domains (1.7%).
Date headers set to the past will be otherwise ignored, but impacted 22,324 domains (3.0%).
The largest positive offset was 39,867,698 seconds, landing us 461 days in the future (March 2027 at scan time).

If we graph this we'll see that the vast majority of our non-negative offsets are very near zero.
We also observe that very large offsets are possible but quite rare.

{{< figure
    src="non-negative.png"
    title="Plot of non-negative offsets and their frequency"
    alt="A graph title 'Measured Clock Offset', with X axis label 'Offset in seconds' and Y axis label 'Observations'. The data points only occur on the axes such that details are difficult to see"
    link="non-negative.png"
>}}

I can't make out many useful trends from this graph.
The large amount of data points near zero seconds skews the vertical scale and the huge offsets skew the horizontal scale.
Adjusting the graph to focus on 10 seconds to 86,400 seconds (one day) and switching offsets to a log scale provides this graph:

{{< figure
    src="non-negative-zoomed.png"
    title="Zoomed-in plot of non-negative offsets and their frequency"
    alt="A zoomed in version of the previous graph. The data points are distributed in a rough power-law distribution with occasional upward spikes"
    link="non-negative-zoomed.png"
>}}

This curve is much closer to my expectations.
I can see that small offsets of less than a minute have many observances.


### Analysis


#### Spikes at whole hours

One thing I didn't expect were spikes at intervals of whole hours, but it makes a lot of sense in hindsight.
This next graph shows the first day, emphasizing data points that exactly align to whole hour offsets.

{{< figure
    src="whole-hours.png"
    title="Alignment with whole hours"
    alt="A graph titled 'Hourly offsets', with X axis labeled 'Offset in hours' and Y axis labeled 'Observations'. Data points in red aligned with whole hours stand out as the highest data points"
    link="whole-hours.png"
>}}

The largest spikes occur at one, three, and nine hours with no clear trend.
Thankfully, geography seems to explain these spikes quite well.

Here are the top-level domains (TLDs) of domains seen with exactly one hour offset:

      4 de
      3 com
      2 net
      2 cz
      1 se
      1 no
      1 it
      1 be

Germany (.DE), Czech Republic (.CZ), Sweden (.SE), Norway (.NO), Italy (.IT), and Belgium (.BE) are all currently using Central European Time, which uses offset UTC+1.

TLDs of domains seen with exactly three hour offset:

      4 ru
      2 com
      1 org
      1 online
      ...

The country-code top-level domain (ccTLD) for Russia is .RU and Moscow Standard Time is UTC+3.

TLDs of domains with exactly nine hour offset:

     16 kr
      6 com
      1 cc

South Korea (.KR) and Cocos (Keeling) Islands (.CC) follow UTC+9.

So I strongly suspect these whole-hour offset spikes are driven by local time zones.
These systems seem to have set their UTC time to the local time, perhaps due to an administrator who set the time manually to local time, instead of using UTC and setting their timezone.
While this type of error is quite rare, impacting only 49 of the measured domain names (0.007%), the large offsets could be problematic.


#### Shared hosting

Another anomalous datapoint at 113 seconds caught my attention.

{{< figure
    src="spike-at-113-seconds.png"
    alt="A graph showing about 90 observations of the 113 second offset, about 45 observations of the 114 second offset and other neighboring data points falling below 20 observations"
    title="Elevated observations at 113 seconds"
    link="spike-at-113-seconds.png"
    >}}

Almost all of the data points at the 113 second offset are for domain names hosted by the same internet service provider using the same IP block.
A single server can handle traffic for many domain names, all of which will have the same clock offset.
We'll see more examples of this pattern later.


### Modeling

Knowing that we have some anomalous spikes due to shared hosting and spikes at whole hour intervals due to timezone issues, I smoothed out the data to perform modeling.
Here's a graph from zero to fifty-nine minutes, aggregating ten second periods using the median.

{{< figure
    src="power-law-median.png"
    alt="A graph showing a power-law trend line over the smoothed out dataset"
    title="Power-law trend model matches the data"
    link="power-law-median.png"
>}}

I added a power-law trend line, which matches the data quite well (R^2^ = 0.92).
I expected to see a power-law distribution, as these are common when modeling randomized errors, so my intuition feels confirmed.

The average clock offset, among those with a non-negative offset, was 6544.8 seconds (about 109 minutes).
The median clock offset was zero.
As with other power-law distributions, the average doesn't feel like a useful measure due to the skew of the long tail.


## What about historical clock synchronization?

The HTTP Date header measurement has proven useful for assessing offsets of modern clocks, but I'm also interested in historical trends.
I expect that computers are getting better at keeping clocks synchronized as we get better at building hardware, but can we measure it?
I know of some bizarre issues that have popped up over time,
like [this Windows STS bug](https://learn.microsoft.com/en-us/troubleshoot/windows-server/active-directory/sts-recommendations-for-windows-server#timekeeping-issues-related-to-sts),
so its even possible we've regressed.

Historical measurements require us to ask "when was this timestamp generated?" and measure the error.
This is obviously tricky as the point of the timestamp is to record the time, but we suspect the timestamp has error.
Somehow, we've got to find a more accurate time to compare each timestamp against.

It took me a while to think of a useful dataset, but I think git commits provide a viable way to measure historical clock offsets.


## Git commit timestamps

We've got to analyze git commit timestamps carefully as there's lots of ways timestamps can be out of order even when clocks are fully synchronized.

Let's first understand how "author time" and "commit time" work.
When you write some code and `git commit` it, you've "authored" the code.
The git history at this point will show both an "author time" and "commit time" of the same moment.
Later you may merge that code into a "main" branch, which updates the "commit time" to the time of the merge.
When you're working on a team you may see code merged in an order that's opposite the order it was written, meaning the "author times" can be out of chronological order.
The "commit times", however, should be in order.

### Linux kernel

The Linux kernel source tree is a good candidate for analysis.
Linux was one of the first adopters of git, as git was written to help Linux switch source control systems.
My local git clone of Linux shows 1,397,347 commits starting from 2005.
It may be the largest substantive project using git, and provides ample data for us to detect timestamp-based anomalies.

I extracted the timing and other metadata from the git history using:

    $ git log --date=unix --pretty=format:"%H;%ae;%ce;%ad;%cd"

Here's a graph of the "commit time", aggregating 1000 commit blocks using various percentiles, showing that commits times are mostly increasing.

{{< figure
    src="linux-commit-agg-ct.png"
    alt="A graph titled 'Commit Timestamps' with X axis labeled 'Commit Index' and Y axis labeled 'Unix Timestamp'. The legend shows minimum, median, and maximum in blue, orange, and yellow. The data is almost all along a curve, showing tight commit timestamps. The curve bends up and to the right with a noticeable anomaly around unix timestamp 1400000000"
    title="Linux commit timestamps follow a narrow path"
    link="linux-commit-agg-ct.png"
>}}

While there's evidence of anomalous commit timestamps here, there are too few for us find meaningful trends.
Let's keep looking.

Here's a graph of the "author time" showing much more variation:

{{< figure
    src="linux-commit-agg-at.png"
    alt="A graph titled 'Author Timestamps' with X axis labeled 'Commit Index' and Y axis labeled 'Unix Timestamp'. The legend shows minimum, median, and maximum in blue, orange, and yellow. Most data points fall along a seemingly linear curve, which trends up and to the right. Minimum data points descend quite far, one going as low as zero, but these are rare. Similarly, Maximum data points can be quite high, but only rarely"
    title="Linux author times show greater variance and anomalies"
    link="linux-commit-agg-at.png"
>}}

We should expect to see author times vary, as it takes differing amounts of time for code to be accepted and merged.
But there are also large anomalies here, including author times that are decidedly in the future and author times that pre-date both git and Linux.
We can get more detail in the graph by zooming into the years Linux has been developed thus far:

{{< figure
    src="linux-commit-agg-at-zoom.png"
    alt="A zoomed-in version of the previous graph. The minimum data points now descend visibly from the median and maximum values"
    title="Linux author times detail"
    link="linux-commit-agg-at-zoom.png"
>}}

This graph tells a story about commits usually getting merged quickly, but some taking a long time to be accepted.
Certain code taking longer to review is expected, so the descending blue data points are expected.


### Commit time versus author time

There are many different measurements we could perform here, but I think the most useful will be "author time" minus "commit time".
Typically, we expect that code is developed, committed, reviewed, approved, and finally merged.
This provides an author time that is less than the commit time, as review and approval steps take time.

{{< figure
    src="TypicalCommitMerge.drawio.png"
    alt="A timeline showing development, then a commit, which provides an author timestamp. Then review and a merge, which provides a commit timestamp. The commit timestamp occurs after the author timestamp"
    title="A simplified, typical development timeline"
    link="TypicalCommitMerge.drawio.png"
>}}


A positive value of author time minus commit time would indicate that the code was authored in the future, relative to the commit timestamp.
We can't be sure whether the author time or the commit time was incorrect (or both), but collectively they record a timestamp error.

These commits are anomalous as the code was seemingly written, committed, then traveled back in time to be merged.
We'll refer to these commits as time travelling commits, although timestamp errors are very likely the correct interpretation.

{{< figure
    src="TimeTravelCommitMerge.drawio.png"
    alt="A similar timeline, however the merge event generates a commit timestamp that is earlier than the author timestamp"
    title="A time travelling commit"
    link="TimeTravelCommitMerge.drawio.png"
>}}

Looking at the Linux git repo, I see 1,397,347 commits, of which 1,773 are time travelling commits.
This is 0.127% of all commits, a somewhat rare occurrence.
Here's a graph of these timestamp errors:

{{< figure
    src="Linux-Commits-Offset-By-Commit-Time-Annotated.png"
    alt="A graph titled 'Linux Author-Commit Timestamp Offset' with X axis labeled 'Commit Timestamp' and Y axis labeled 'Offset (seconds)'. Four regions are marked with labels A, B, C, and D as explained below."
    title="Patterns found in time travelling commits"
    link="Linux-Commits-Offset-By-Commit-Time-Annotated.png"
>}}


There are some fascinating patterns here!

Ignoring the marked regions for a moment, I notice that offsets below 100 seconds are rare; this is quite *unlike* the pattern seen for HTTP Date header analysis.
I suspect the challenge is that there is usually a delay between when a commit is authored and when it is merged.
Code often needs testing and review before it can be merged; those tasks absorb any small timestamp errors.
This will make modeling historical clock offset trends much more difficult.

#### Region A

The region marked "A" shows many errors below 100 seconds, especially along linear spikes.
There appears to be two committers in this region, both using "de.ibm.com" in their email address.
The majority of authors in region A have "ibm.com" in their email address.
So these anomalies appear to be largely due to a single company.

These commits appear to have the author timestamp rewritten to a (mostly) sequential pattern.
Here are the commits for two of the days:

    Offset  Committer Date  Author Date     Day
    1       1238077456      1238077457      2009-03-26
    1       1238077457      1238077458      2009-03-26
    2       1238077457      1238077459      2009-03-26
    2       1238077458      1238077460      2009-03-26
    3       1238077458      1238077461      2009-03-26
    4       1238077458      1238077462      2009-03-26
    4       1238077459      1238077463      2009-03-26
    5       1238077459      1238077464      2009-03-26
    5       1238077460      1238077465      2009-03-26
    6       1238077460      1238077466      2009-03-26
    7       1238077460      1238077467      2009-03-26
    7       1238077461      1238077468      2009-03-26
    8       1238077461      1238077469      2009-03-26
    9       1238077461      1238077470      2009-03-26
    9       1238077462      1238077471      2009-03-26
    10      1238077462      1238077472      2009-03-26
    10      1238077463      1238077473      2009-03-26
    11      1238077463      1238077474      2009-03-26
    12      1238077463      1238077475      2009-03-26
    12      1238077464      1238077476      2009-03-26
    13      1238077464      1238077477      2009-03-26
    13      1238077465      1238077478      2009-03-26
    14      1238077465      1238077479      2009-03-26
    15      1238077465      1238077480      2009-03-26
    15      1238077466      1238077481      2009-03-26
    16      1238077466      1238077482      2009-03-26
    16      1238077467      1238077483      2009-03-26
    17      1238077467      1238077484      2009-03-26
    18      1238077467      1238077485      2009-03-26
    18      1238077468      1238077486      2009-03-26
    19      1238077468      1238077487      2009-03-26
    19      1238077469      1238077488      2009-03-26
    20      1238077469      1238077489      2009-03-26
    21      1238077469      1238077490      2009-03-26
    21      1238077470      1238077491      2009-03-26
    22      1238077470      1238077492      2009-03-26
    23      1238077470      1238077493      2009-03-26
    23      1238077471      1238077494      2009-03-26
    24      1238077471      1238077495      2009-03-26
    24      1238077472      1238077496      2009-03-26
    25      1238077472      1238077497      2009-03-26
    26      1238077472      1238077498      2009-03-26
    26      1238077473      1238077499      2009-03-26
    27      1238077473      1238077500      2009-03-26
    27      1238077474      1238077501      2009-03-26
    28      1238077474      1238077502      2009-03-26
    ---
    1       1177682503      1177682504      2007-04-27
    2       1177682503      1177682505      2007-04-27
    3       1177682503      1177682506      2007-04-27
    3       1177682504      1177682507      2007-04-27
    4       1177682504      1177682508      2007-04-27
    5       1177682504      1177682509      2007-04-27
    5       1177682505      1177682510      2007-04-27
    6       1177682505      1177682511      2007-04-27
    7       1177682505      1177682512      2007-04-27
    8       1177682505      1177682513      2007-04-27
    8       1177682506      1177682514      2007-04-27
    9       1177682506      1177682515      2007-04-27
    10      1177682506      1177682516      2007-04-27
    11      1177682506      1177682517      2007-04-27
    11      1177682507      1177682518      2007-04-27
    12      1177682507      1177682519      2007-04-27
    13      1177682507      1177682520      2007-04-27
    13      1177682508      1177682521      2007-04-27

The author dates here are perfectly sequential, with one second between each commit.
The commit dates also increase, but more slowly, such that the difference between author date and commit date increases with later commits.

I suspect these timestamps were set via some sort of automation software when processing a batch of commits.
The software may have initially set both author and commit timestamps to the current time, but then incremented the author timestamp by one with each subsequent commit while continuing to use the current time for the commit timestamp.
If the software processed commits faster than one per second, we'd see this pattern.

I don't think these timestamps are evidence of mis-set clocks, but rather an automated system with poor timestamp handling code.


#### Region B

The region marked "B" shows many errors near a 15.5 hour offset (with several exactly on the half-hour mark).

Looking at the email addresses I see several "com.au" domains, suggesting some participants were located in Australia (.AU).
Australia uses several time zones, including UTC+8, UTC+8:45, UTC+9:30, UTC+10, UTC+10:30, and UTC+11... but nothing near 15.5 hours.

The GitHub profiles for one of the committers shows a current timezone of UTC-5.
This suggests that an author in Australia and a committer in the Americas both mis-set their clocks, perhaps combining UTC+10:30 and UTC-5 to to reach the 15.5 hour offset.
We saw examples of timezone related clock errors when looking at the HTTP Date header; this appears to be an example of two timezone errors combining.

#### Region C

The region marked "C" shows many error around 30 to 260 days, which are unusually large errors.
The committer for each of these is the same email address, using the "kernel.org" domain name.
If we render the author and committer timestamps we'll see this pattern:

    Count Author time Committer time
        2 2014-04-02  2014-02-08
        2 2014-05-02  2014-02-08
        1 2014-05-02  2014-02-15
        1 2014-05-03  2014-03-06
        2 2014-05-03  2014-03-15
        2 2014-07-01  2014-01-11
        1 2014-08-01  2014-02-08
        1 2014-08-03  2014-03-16
        1 2014-08-04  2014-04-11
        2 2014-08-05  2014-05-10
        1 2014-09-01  2014-01-11
        1 2014-09-05  2014-05-10
        2 2014-10-01  2014-01-11
        1 2014-10-01  2014-01-12
        3 2014-10-01  2014-02-08
        2 2014-10-01  2014-02-15
        4 2014-10-03  2014-03-16
        3 2014-10-03  2014-04-12
        1 2014-10-06  2014-06-14
        1 2014-11-01  2014-01-11
        2 2014-11-06  2014-06-14
        1 2014-11-06  2014-06-16
        1 2014-11-06  2014-06-21
        1 2014-11-06  2014-07-08
        1 2014-11-07  2014-07-12
        1 2014-11-07  2014-07-13
        1 2014-11-09  2014-09-14
        1 2014-12-02  2014-03-15
        1 2014-12-03  2014-03-15
        1 2014-12-03  2014-03-16
       14 2014-12-06  2014-06-14
        1 2014-12-06  2014-06-21
       10 2014-12-06  2014-07-13

I notice that the day in the author timestamp usually matches the month in the committer timestamp, and when it doesn't it's one smaller.
When the author day and the committer month match, the author month is less than or the same as the committer day.
The days in the author timestamp vary between one and nine, while the days in the commit timestamp vary between eight and twenty-one.
This suggests that the author timestamp was set incorrectly, swapping the day and month.
Looking at these commits relative to the surrounding commits, the commit timestamps appears accurate.

If I fix the author timestamps by swapping the day and month, then the data points are much more reasonable.
The author timestamps are no longer after the commit timestamps, with differences varying between zero and thirty-six days, and an average of nine days.

So it seems these author timestamps were generated incorrectly, swapping month and day, causing them to appear to travel back in time.

{{< figure
    src="large-time-travel.png"
    alt="A screen shot showing a commit authored on 2014-12-03, then traveling back in time to 2014-03-16 to be committed"
    title="Instead of time travelling from December back to March, this commit was likely authored on March 12 and committed four days later"
    link="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=24ddb0e4bba4e98d3f3a783846789520e796b164"
>}}

Git has had code for mitigating these sorts of issues since 2006, like this code that
[limits timestamps to ten days in the future](https://github.com/git/git/blob/57da342c786f59eaeb436c18635cc1c7597733d9/date.c#L542C1-L547C14).

		/* Be it commit time or author time, it does not make
		 * sense to specify timestamp way into the future.  Make
		 * sure it is not later than ten days from now...
		 */
		if ((specified != -1) && (now + 10*24*3600 < specified))
			return -1;

I'm not sure why the commits in region "C" weren't flagged as erroneous.
Perhaps a different code path was used?

Region "C" doesn't appear to be related to a mis-set system clock, but instead a date parsing error that swapped day and month.
This type of error is common when working between different locales, as [the ordering of month and day in a date varies by country](https://en.wikipedia.org/wiki/List_of_date_formats_by_country).


#### Region D

Finally, the region marked "D" shows a relatively sparse collection of errors.
This may suggest that git timestamp related errors are becoming less common.
But there's an analytical hazard here: we're measuring timestamps that are known to time travel.
It's possible that this region will experience more errors in the future!


#### Summary

I suspect region "A" and "C" are due to software bugs, not mis-set clocks.
Region "B" may be due to two clocks, both mis-set due to timezone handling errors.

It seems unwise to assume that I've caught all the anomalies and can attribute the rest of the data points to mis-set clocks.
Let's continue with that assumption anyway, knowing that we're not on solid ground.


### Expanding to more projects

The Linux kernel source tree is an interesting code base, but we should look at more projects.
This next graph counts positive values of "author time" minus "commit time" for Linux, Ruby, Kubernetes, Git, and OpenSSL.
The number of erroneous timestamps is measured per-project against the total commits in each year.

{{< figure
    src="open-source-time-traveling-by-year.png"
    alt="A graph title 'Time travelling commits' with X axis labelled 'Year' and Y axis labelled 'Time travel ratio'"
    title="Time travel trends by project and year"
    link="open-source-time-traveling-by-year.png"
>}}

It's difficult to see a trend here.

Linux saw the most time travelling commits from 2008 through 2011, each year above 0.4%, and has been below 0.1% since 2015.
Git had zero time travelling commits since 2014, with a prior rate below 0.1%.

Digging into the raw data I notice that many time travelling commits were generated by the same pair of accounts.
For Kubernetes, 78% were authored by k8s-merge-robot@users.noreply.github.com and merged by noreply@github.com, although these were only one second in the future.
These appear to be due to the "Kubernetes Submit Queue", where the k8s-merge-robot authors a commit on one system and the merge happens within GitHub.
For Ruby, 89% were authored by the same user and committed by svn-admin@ruby-lang.org with an offset near 30 seconds.
I attempted to correct for these biases by deduplicating commit-author pairs, but the remaining data points were too sparse to perform meaningful analysis.

Time travelling usually reaches its peak two to four years after a project adopts source control, ramping up before, and generally falling after.
This hints at a project management related cause to these spikes.
I'll speculate that this is due to developers initially using Git cautiously as it is new to them, then as they get comfortable with Git they begin to build custom automation systems.
These new automation systems have bugs or lack well-synchronized clocks, but these issues are addressed over time.

I don't think I can make any conclusion from this data about system clocks being better managed over time.
This data doesn't support my expectation that erroneous timestamps would reduce over time, and I'll call this a "negative result".
There's too many challenges in this data set.


## Closing

This analysis explored timestamps impacted by suspected mis-set clocks.
HTTP scanning found that 1.7% of domain names had a Date header mis-set to the future.
Web server offsets strongly matched a power-law distribution such that small offsets were by far the most common.

Git commit analysis found up to 0.65% of commits (Linux, 2009) had author timestamps in the future, relative to the commit timestamp.
No clear historical trend was discovered.

Timestamps with huge offsets were detected.
The largest Linux commit timestamp was in the year 2085 and the largest HTTP Date header was in the year 2027.
This shows that while small timestamps were most common, large errors will occur.

{{< figure
    src="largest-linux-git-time-travel.png"
    alt="A screen shot a Git commit with the year 2085 highlighted"
    title="A Linux commit authored in 2085"
    link="https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4a2d78822fdf1556dfbbfaedd71182fe5b562194"
>}}

Many underlying causes were proposed while analyzing the data, including timezone handling errors, date format parsing errors, and timestamps being overwritten by automated systems.
Many data points were caused by the same group, like IP address blocks used by many domains or Git users (or robots) interacting with multiple commits.
Deduplicating these effects left too few data points to perform trend analysis.

Synchronizing computer clocks and working with timestamps remains a challenge for the industry.

I'm sure there are other data sets that support this kind of measurement.
If you've got any, I'd love to hear what trends you can discover!

