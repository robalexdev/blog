---
title: Designing Personal Software
slug: personal-apps
date: 2024-02-25
summary: Why we need more to-do apps
params:
  guid: 8e571d6e-0895-46af-9437-e851a23d0dc9
  isPopular: true
  categories:
  - Software
---

I've been thinking a lot about the type of software I want to build and use.
I spend so much of my screen time using large feature-heavy software, which are one-size-fits-none at best or outright hostile.
I'm left frustrated, distracted, and wanting something better.

I write lots of mini software projects as a hobby, and a couple have been successful.
By success I don't mean that other people use them, but instead that I keep using them.
Or that my toddlers played with a couple mini games I built, which taught them to use a keyboard and mouse.
These are not things I'd ever put on my resume or claim as examples of good code, but I'm oddly satisfied each time I build one.

Reflecting on my development process I realized that building software for yourself provides several unique benefits.


## Evening chores

My wife and I have a set of tasks that need to get done every night.
It's a repeating pattern each week.
We usually switch off who does chores and who helps the kids get to bed, but sometimes we swap nights or split up the tasks and chit-chat while we work.

A couple examples are:

* Make lunch for kids (if the next day is a school day)
* Move the trash can into the street (if tomorrow is garbage day)
* Water the plants (occasionally)

We could try to remember these things, it's not that hard to do, but after a long day of working, we just want to make the evening easy.
We both really like checking things off a list, the act of marking something done is a little reward that gets us on to the next chore.

### To-do apps

To try to coordinate the evening I tried setting up a couple to-do apps with our weekly tasks.
But each one didn't quite solve the problem and we abandoned each after a while.
The one I remember the most was Todoist.

{{< figure src="assets/todoist.png" title="Todoist: a popular to-do app.  Look at how many different features are on the screen!" >}}

It's a very complicated app and it's visually busy.
There are lots of options for all-of-the-things, none of which I'm going to use.
My goal was to make our evening easier, and something chock-full of colorful features isn't going to do it.

My biggest frustration was that it would roll over to the next day at midnight.
Unfortunately, I tend to procrastinate chores and stay up late (or early, I guess).
At midnight Todoist would mark tasks for the current day as "overdue" and start showing the new day's tasks.
This wasn't my workflow, I wasn't ready to be done with the "current" day and Todoist started showing me tasks that I didn't want to look at yet.
Perhaps there was a way to configure Todoist not to do that, you can often coax feature-full products into doing what you need, but I didn't want to fight with it.

### Whiteboards

After giving up on Todoist and several other apps, I gave up and used a small whiteboard.
It was so much easier!
Most importantly we kept using it.
Here's an example:


{{< figure src="assets/whiteboard.png" alt="A photo of a whiteboard showing a grid of recurring chores" >}}

At the start of the week, we'd reset the board by redrawing a circle on the days when each task needs to be completed. Each evening we'd look at the board for tasks to be done and draw an X for each when complete. So the photo above tells me that I need to put the trash out to complete Wednesday's chores.

At one point we improved the workflow by using some small magnets to track tasks.
We'd slide each magnet to the next occurrence of a task, eventually clearing the current day.
This solved the "where did the marker go" problem, but the concept is largely the same.

### Building my own

As a software developer, I felt a little let down.
Software is supposed to provide a productivity boost yet I preferred an old-school approach.
What went wrong?

Part of the issue is that a whiteboard is effortlessly flexible.
You can track chores, take down messages, build a grocery list, or play tic-tac-toe.
A computer needs to be told about the rules, but with a whiteboard, you can enforce them ad hoc.
With off-the-shelf software, you need to tweak your workflow to match the capabilities of the system.

We could have tried changing our workflows to match existing to-do apps, but we didn't want to.
What if I built my own?

As an initial thought experiment, I built the most literal equivalent in raw HTML.
It's just a bunch of checkboxes and a reset button for the end of the week.
In the rare instances I needed to add a task I could edit the HTML.
This is usable, although rough.


{{< rawhtml >}}
<style>
td, th {
padding: 0.9em 1em 0.9em 1em;
text-align: center;
border: 1px dashed #ccc;
}
</style>
<div class="example" style="padding: 1em; border: 0.3em solid #999;">
<h3 style="margin: 0.2em; text-align: center;">Recurring Chores</h3>
<button onclick='for (var c of document.querySelectorAll("div.example input[type=checkbox]")) {c.checked = false;}'>Reset</button>
<table>
<tr>
<th></th>
<th>Mon</th>
<th>Tues</th>
<th>Wed</th>
<th>Thur</th>
<th>Fri</th>
<th>Sat</th>
<th>Sun</th>
</tr>
<tr>
<th>Cook Dinner</th>
<td><input type="checkbox" checked></td>
<td><input type="checkbox" checked></td>
<td><input type="checkbox" checked></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
</tr>
<tr>
<th>Dishes</th>
<td><input type="checkbox" checked></td>
<td><input type="checkbox" checked></td>
<td><input type="checkbox" checked></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
<td><input type="checkbox"></td>
</tr>
<tr>
<th>Water Plants</th>
<td><input type="checkbox" checked></td>
<td></td>
<td><input type="checkbox" checked></td>
<td></td>
<td><input type="checkbox"></td>
<td></td>
<td></td>
</tr>
<tr>
<th>Put out trash</th>
<td></td>
<td></td>
<td><input type="checkbox"></td>
<td></td>
<td></td>
<td></td>
<td></td>
</tr>
<tr>
<th>Laundry</th>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td><input type="checkbox"></td>
<td></td>
</tr>
<tr>
<th>Meal Prep</th>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td></td>
<td><input type="checkbox"></td>
</tr>
</table>
</div>
{{< /rawhtml >}}

This approach is simple enough I've embedded it in the blog post.

This still didn't feel right.

I still feel like there's too much on the screen.
Do I need to look at tasks for Friday when I'm trying to work on Wednesday's chores?
Reducing visual distractions turned out to be important to us.

### Chore Wheel

Eventually, I built
[Chore Wheel](https://alexsci.com/chore-wheel/).
Chore Wheel isn't a general-purpose task tracker, it solves a specific problem, for two people, and I run it from a single device.

{{< figure src="assets/chore-wheel.png" alt="Chore Wheel screenshot" >}}


Chore Wheel clicked for us and we used it every single night for about a year.
It even felt better than the whiteboard, which was repurposed.

I think there are a couple reasons why Chore Wheel worked so well for us:

* It shows a single day at a time
* The user decides when to move to the next day
* A chore is completed with a single tap
* Adding a task has a simple UI
* There are no unneeded features

There are also a number of anti-features that are intentionally missing.

I don't care about cross-device syncing.
We already had a kitchen iPad for music and recipes, so it became the dedicated Chore Wheel device.
I don't want the app on my phone because if I take my phone out to check the list I'll start doing something else instead.
The kitchen iPad has nothing but the software we use in the kitchen, minimizing distractions.
Introducing syncing would require a back-end, authentication, and a whole bunch of other things.
The app avoids that by saving to the browser's local storage.

Chore Wheel doesn't assign tasks.
I could easily add something that helps us decide who's in charge of chores for the evening.
This would ensure that chores are being done equally, but <i>not equitably</i>.
If my wife had a rough day at the office, I'd much prefer to notice and tackle the chores myself than for the app to tell her she's on the hook.
Splitting responsibilities exactly 50/50 leads to resentment, which I wanted to avoid.

You may have noticed Chore Wheel has an unusual style.
Admittedly adding a CSS framework was planned but I found I liked the unique look I organically built.
I think this style works well specifically because it doesn't look like all the other software out there.
If I'm staring at a to-do list that looks like the software I use at work, suddenly I'm thinking about work again.

Finally, Chore Wheel has some whimsy.
I never add fun elements to projects at my day job, that's just not the type of software I work on, and I'm usually opposed to excess visuals.
But for Chore Wheel I added some CSS confetti that pours down when the list is complete.
I think it's usually hard to know when it's OK to add fun elements, but for personal projects, you just build what feels right to you.

{{< figure src="assets/chore-wheel-success.png" alt="Chore Wheel confetti" >}}


### Philosophy

There are a couple philosophical concepts at play here.

First is that software should do a single job.
Chore Wheel only tracks our evening chores.
There are lots of other to-do lists we create:
which groceries to buy,
when to do car maintenance,
packing lists,
and so on.
Chore Wheel doesn't concern itself with those.

Second is that perfection is achieved when there's nothing left to take away.
General-purpose software tries to solve so many different jobs that it can't be simplified.
Chore Wheel solves such a narrowly scoped problem that it can be reduced very far.

I don't take either philosophy to the extreme.

## Build your own to-do app

I don't expect others to find Chore Wheel useful.
The app is aggressively optimized for our needs in a very specific workflow.
Instead, I want to encourage you to try creating your own to-do app.

Building software for yourself that you'll actually enjoy using is an adventure in self-discovery.
You'll learn a little more about what motivates you and how your brain works.
Starting with something small like a to-do list helps you focus on your personal user-stories instead of getting caught up building complicated internals.

Start by looking at what kind of to-do lists you create already.
These could be on paper, whiteboard, in an app, or in your head.
Pick exactly one list to focus on.

Consider where you are when you make the list, how you decide what to add, and how you complete tasks on the list.
This is the workflow you're going to work with.
Think about how a custom app would help you perform the workflow as-is.
If there are things that aren't working in the workflow, think about how a custom app could change the workflow.

Finally, build an MVP and iterate.
Keep it simple, have fun, and make it yours.
Starting from a simple prompt of "build a to-do list" everyone will end up at something drastically different.






<script>hljs.highlightAll();</script>
