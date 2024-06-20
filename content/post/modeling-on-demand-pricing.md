---
title: A mental model for on-demand pricing
slug: modeling-on-demand-pricing
date: 2023-05-07
summary: A model for thinking about AWS EC2 on-demand and reserved pricing
params:
  guid: c38ec5fe-866c-455b-a7e7-ea2efa7993ca
  isPopular: true
  categories:
  - Cloud
  - Cost Optimization
---

{{< rawhtml >}}
<style>
td {
  padding: 0.5em;
  text-align: center;
}

td.price {
  text-align: end;
}

td.good {
  background-color: #cdc;
}

td.bad {
  background-color: #dcc;
}

thead td {
  font-weight: bold;
}

tbody td {
  border: 2px solid #ddd;

}

table {
  padding-bottom: 3em;
}
</style>
{{< /rawhtml >}}


## Background

Cost optimization is a constant concern in cloud architecture.
Cloud vendors often obfuscate costs or frame costs in unhelpful ways.
Changing the way you think about cloud computing costs can be a really helpful way towards getting your bill under control.
In this post I discuss a strategy for deciding how many instances to reserve when auto-scaling.

## Escape marketing the narratives

The first trick cloud marketers pulled off was to get everyone thinking about computing costs using the on-demand pricing as a baseline.
This lets them frame reserved instances as a discount or a savings; they are giving you a deal!

Avoid this style of thinking.

Let's look at some pricing examples.

*Prices from [Vantage's EC2 Instance Comparison tool](https://instances.vantage.sh).
EC2 instances running Linux in us-east-2 (Ohio), monthly cost.
Reserved costs are "no upfront" for one year.
Actual prices subject to change.
Excluding EBS, data transfer, and other expected costs.*

{{< rawhtml >}}
<table>
<thead>
<tr>
<td>Type</td>
<td>GiB RAM</td>
<td>#vCPU</td>
<td>On-Demand</td>
<td>Reserved</td>
<td>Savings</td>
</tr>
</thead>
<tbody>
<tr>
<td>t4g.nano</td>
<td>0.5</td>
<td>2</td>
<td class="price">$3.07</td>
<td class="price">$1.90</td>
<td>62%</td>
</tr>

<tr>
<td>t3.small</td>
<td>2</td>
<td>2</td>
<td class="price">$15.18</td>
<td class="price">$9.49</td>
<td>63%</td>
</tr>

<tr>
<td>t3.medium</td>
<td>4</td>
<td>2</td>
<td class="price">$30.37</td>
<td class="price">$19.05</td>
<td>63%</td>
</tr>

<tr>
<td>c5.4xlarge</td>
<td>32</td>
<td>16</td>
<td class="price">$496.40</td>
<td class="price">$312.44</td>
<td>63%</td>
</tr>

<tr>
<td>i3.xlarge</td>
<td>30.5</td>
<td>4</td>
<td class="price">$227.76</td>
<td class="price">$156.22</td>
<td>69%</td>
</tr>

<tr>
<td>i2.xlarge</td>
<td>30.5</td>
<td>4</td>
<td class="price">$622.69</td>
<td class="price">$309.52</td>
<td>50%</td>
</tr>

</tbody>
</table>
{{< /rawhtml >}}

Framing the pricing this way tends to make on-demand the default choice.
It looks like you have the option to save money, if you can predict your usage and reserve your instances.

However, if I flip the narrative to make reserved the baseline, this changes:

{{< rawhtml >}}
<table>
<thead>
<tr>
<td>Type</td>
<td>GiB RAM</td>
<td>#vCPU</td>
<td>Reserved</td>
<td>On-Demand</td>
<td>Markup</td>
</tr>
</thead>
<tbody>
<tr>
<td>t4g.nano</td>
<td>0.5</td>
<td>2</td>
<td class="price">$1.90</td>
<td class="price">$3.07</td>
<td>1.6</td>
</tr>

<tr>
<td>t3.small</td>
<td>2</td>
<td>2</td>
<td class="price">$9.49</td>
<td class="price">$15.18</td>
<td>1.6</td>
</tr>

<tr>
<td>t3.medium</td>
<td>4</td>
<td>2</td>
<td class="price">$19.05</td>
<td class="price">$30.37</td>
<td>1.6</td>
</tr>

<tr>
<td>c5.4xlarge</td>
<td>32</td>
<td>16</td>
<td class="price">$312.44</td>
<td class="price">$496.40</td>
<td>1.6</td>
</tr>

<tr>
<td>i3.xlarge</td>
<td>30.5</td>
<td>4</td>
<td class="price">$156.22</td>
<td class="price">$227.76</td>
<td>1.5</td>
</tr>

<tr>
<td>i2.xlarge</td>
<td>30.5</td>
<td>4</td>
<td class="price">$309.52</td>
<td class="price">$622.69</td>
<td>2.0</td>
</tr>

</tbody>
</table>
{{< /rawhtml >}}

Now I'm thinking, "Ouch those on-demand instances are pricey!"
I'd need to justify paying a premium over the "default" option of a reserved instance.
If I can't predict my usage, then I'm going to pay a premium.

Is this mental model better?
No, not really.
It's just another way marketing can frame prices to stir up emotions.
Let's find a better model.

## Fixed percent markup

About 92% of the EC2 instances available show an on-demand markup between 1.5x and 1.7x.
The mean and median markup is 1.6x.
I'm not certain why AWS uses this number.
It could be based on utilization rates, desired profit margins, or an artifact of financial risk management.
Whatever the cause, knowing this "constant" can greatly speed up thinking about cost optimizations.

{{< figure src="markup.png" alt="Graph showing a markup line that mostly stays near 1.6" >}}

I included i2.xlarge in the table as it's clearly an outlier.
The entire i2 family (xlarge, 2xlarge, 4xlarge, and 8xlarge) use a 2x markup.
You can see those as the four large spikes in the graph.
I suspect the higher rate reflects that the i2 series is a "previous generation" instance and customers should migrate to new hardware.
In this case, that's the i3 family, which all use a 1.5x markup.
As customers migrate off this old hardware it will become harder and harder to support variable demand.
If you're using these, please upgrade, the new instance types are much cheaper.

## Thinking in markups

If we base our cloud-pricing mental model in reserved instances, then an on-demand instance (running 100% of the time) costs about 1.6 times more.
Let's define this as a constant: the "on-demand markup" constant is 1.6.
Under this model, a reserved instance costs 1 and an on-demand instance running 50% of the time costs 0.8 (I.E. half of the "on-demand markup" constant).
These unit-less costs can help decide when it makes sense to use a reserved instance, and when an on-demand instance is better.

Unit-less values can be confusing to deal with, so I'll make up a unit "C" so you know we're talking about unit-less cost.

To get back to actual costs, just multiply by the reserved instance cost.
For example: 3.5 C for t3.median is $66.68 (`3.5 C × $19.05 = $66.675`) monthly.
It doesn't matter if those are all on-demand instances, or if some of them are reserved, we've abstracted that away.

## Break even points

Every pricing effort has a different starting place.
Maybe you're running on-demand instances and looking to get a discount by running reserved instances to handle your baseline load.
Maybe you're running a reserved instance fleet and you'd like to scale down when load is low, again reducing costs.
In either case, you're going to want to find break even points.

We can figure out how many hours a day we can run an on-demand instance before its cheaper to just reserve it.
This is easy to calculate with the on-demand markup constant:

    1.6 C × N = 1 C × 24 hours
    N = 24 hours ÷ 1.6
    N = 15 hours

On-demand only makes sense if you can run the instance for less than 15 hours per day, otherwise reserved is cheaper.
Or the other way, on-demand becomes viable if you can keep an instance off for at least 9 hours per day.

Each hour an on-demand instance runs costs 0.0667 C (`1.6 C ÷ 24 hours = 0.0667 C per hour`).
If you run an on-demand instance for 14 hours a day, one hour below the 15 hour break-even point, then you can save 0.0667 C.
If you only need it for five hours, then you're ten hours below and you save 0.667 C.
The opposite is also true, if you run an on-demand instance for 16 hours a day, one hour above the break-even point, then you're spending 0.0667 C more than if you had reserved it.
If you run an on-demand instance 100% of the time then the cost is 0.6 C (`9 × 0.0667 C = 0.6 C`) more than reserved (there's our 1.6x markup again).

If your load is more seasonal, you'll want to calculate the break even point in days:

    1.6 C × N = 1 C × 365 days
    N = 365 days ÷ 1.6
    N ≈ 228 days

You'll need to turn your on-demand instance off at least 137 days per year to see a benefit.
Each excess on-demand day costs 0.0044 C.

If your load pattern has both seasonal and daily patterns, you'll need to build a hybrid model.

## Reserve more than baseline load

It's tempting to use reserved instances for your baseline load and to use on-demand instances for the variable load.
But this is not optimal!
You may benefit from making the cut a little higher.

Consider the following simplified load pattern.
It's a sinusoidal load centered on 100 requests per second (RPS) rising and falling 40 RPS through a single day.
Your load pattern will be different, so treat the following as an example only.


{{< figure src="load.png" alt="A graph showing sinesoidal load over the day and instance counts as a step function overlayed" >}}

If each instance can handle ten RPS, then fourteen instances can handle the peak load and seven can handle the minimum load.
You may expect the minimum to be six instances, as the minimum load is 60 RPS, but this is only momentarily true.
As soon as the request rate rises, to say 60.1 RPS, you'll need to round up to seven instances.
This is too brief to scale down to six instances.
I've marked the number of required instances in red, which follows a step pattern.

To optimize cost, you'll want to determine how many instances can be turned off for nine hours or more.
Remember, you won't see a cost savings if you run an on-demand instance for 15 hours or more.
I counted the required instance counts throughout the day as:

{{< rawhtml >}}
<table>
<thead>
<tr><td># of instances</td><td>hours</td></tr>
</thead>
<tbody>
<tr>
  <td>7</td><td>24</td>
</tr>
<tr>
  <td>8</td><td>18.5</td>
</tr>
<tr>
  <td>9</td><td>16</td>
</tr>
<tr>
  <td>10</td><td class="good">14</td>
</tr>
<tr>
  <td>11</td><td class="good">11.9</td>
</tr>
<tr>
  <td>12</td><td class="good">10.1</td>
</tr>
<tr>
  <td>13</td><td class="good">8</td>
</tr>
<tr>
  <td>14</td><td class="good">5.5</td>
</tr>
</tbody>
</table>
{{< /rawhtml >}}

My baseline load requires seven instances but I'll want to reserve nine instances, since each of those is needed for too many hours.
The rest will be on-demand:

* the tenth instance I'll run on-demand for fourteen hours, reducing the cost of that instance by 0.0667 C (`savings = (15 - 14) × 0.0667 C`)
* the 11th instance I'll run on-demand for about 12 hours, reducing the cost of that instance by 0.19 C (`savings = (15 - 12) × 0.0667 C`)
* the 12th at about 10 hours and a 0.333 C reduction
* the 13th at 8 hours and a 0.466 C reduction; and
* the 14th at 5.5 hours and a 0.633 C reduction.

## Comparing strategies

Now that we know the optimal strategy, we can contrast it with other strategies.

The "all on-demand" strategy will use auto-scaling, but doesn't reserve any instances.
You should expect to save some money when it turns off unneeded instances but to overpay for the baseline load.

The "all reserved" strategy will reserve the maximum required instances and keep them all running.
It's very easy to compute the cost of this strategy, each instance costs 1 C, and a total of 14 C for our example.

The "baseline" strategy will reserve instances for the minimum load and will use on-demand instances to auto-scale for the remaining load.

Finally, the "optimal" strategy reserves instances such that any running 15 hours a day or more are reserved and the rest are auto-scaling on-demand instances.
Since we know 15 hours is the break even point, this should perform the best.

{{< rawhtml >}}
<table>
<thead>
<tr>
  <td>Utilization</td>
  <td>All on-demand</td>
  <td>All reserved</td>
  <td>Baseline</td>
  <td>Optimal</td></tr>
</thead>
<tbody>

<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>
<tr><td>24 hrs</td><td class="bad">1.6 C</td><td>1 C</td><td>1 C</td><td>1 C</td></tr>

<tr>
  <td>18.5hrs</td>
  <td class="bad">1.23 C</td>
  <td>1 C</td>
  <td class="bad">1.23 C</td>
  <td>1 C</td>
</tr>
<tr>
  <td>16hrs</td>
  <td class="bad">1.07 C</td>
  <td>1 C</td>
  <td class="bad">1.07 C</td>
  <td>1 C</td>
</tr>
<tr>
  <td>14hrs</td>
  <td class="good">0.93 C</td>
  <td>1 C</td>
  <td class="good">0.93 C</td>
  <td class="good">0.93 C</td>
</tr>
<tr>
  <td>12hrs</td>
  <td class="good">0.81 C</td>
  <td>1 C</td>
  <td class="good">0.81 C</td>
  <td class="good">0.81 C</td>
</tr>
<tr>
  <td>10hrs</td>
  <td class="good">0.65 C</td>
  <td>1 C</td>
  <td class="good">0.65 C</td>
  <td class="good">0.65 C</td>
</tr>
<tr>
  <td>8hrs</td>
  <td class="good">0.53 C</td>
  <td>1 C</td>
  <td class="good">0.53 C</td>
  <td class="good">0.53 C</td>
</tr>
<tr>
  <td>5.5hrs</td>
  <td class="good">0.36 C</td>
  <td>1 C</td>
  <td class="good">0.36 C</td>
  <td class="good">0.36 C</td>
</tr>
<tr>
  <td>Totals</td>
  <td class="bad">19.98 C</td>
  <td>14 C</td>
  <td class="good">12.56 C</td>
  <td class="good">12.28 C</td>
</tr>
</tbody>
</table>
{{< /rawhtml >}}

As promised, the optimal strategy performs the best.
I've shaded cells in red when they are above the 1 C cost of a reserved instance and green when we're getting a discount.
This clearly shows when each strategy does well, and where it performs poorly.

Something else I hope jumps out here: auto-scaling with only on-demand instances is the most expensive option, about 43% worse than using a fixed-size reserved instance fleet.
If you've got baseline load, you may be better off reserving instances than auto-scaling, if you only choose one.

## Visually

If all this math and numbers is too much, here's the solution visually.
Draw a horizontal line through the graph at the point where exactly 15 hours per day are below the load curve.
Divide these RPS by the load each instance can handle (10 RPS in this example).
This is the number of instances you should reserve, the rest can be on-demand.

{{< figure src="load-optimal.png" alt="The same graph with a horizontal line at 90 RPS" >}}


## Extreme examples

Can you tell the optimal strategy just from the shape of these load graphs?

{{< rawhtml >}}<br /><br /><br />{{< /rawhtml >}}

{{< figure src="flat-load.png" alt="A graph without axes showing a flat line" >}}

When load is flat: the best strategy is to reserve instances.
There's no opportunity to turn off instances so on-demand and auto-scaling won't help.

{{< rawhtml >}}<br /><br /><br />{{< /rawhtml >}}


{{< figure src="load-spike.png" alt="A graph without axes showing line that starts at zero, briefly jumps up to N, then returns to zero." >}}

When load is extremely spiky: you can auto-scale, letting you save money on the off-hours.

{{< rawhtml >}}<br /><br /><br />{{< /rawhtml >}}

{{< figure src="load-table.png" alt="A graph without axes showing a line that starts at zero, jumps up to N stays there for most of the graph, then returns to zero." >}}

When load is briefly low: auto-scaling won't save costs as you won't be able to turn off on-demand instances long enough.

{{< rawhtml >}}<br /><br /><br />{{< /rawhtml >}}

Hopefully those weren't too challenging.
These concepts can help visually assess where auto-scaling and on-demand instances can help.

## Back to dollars

In absolute terms, the *estimated* annual cost of the example would be:

{{< rawhtml >}}
<table>
<thead>
<tr>
  <td>Instance type</td>
  <td>All on-demand</td>
  <td>All reserved</td>
  <td>Baseline</td>
  <td>Optimal</td>
</tr>
</thead>
<tbody>
<tr>
  <td>t4g.nano</td>
  <td>$455</td>
  <td>$318</td>
  <td>$286</td>
  <td>$279</td>
</tr>
<tr>
  <td>t3.small</td>
  <td>$2,275</td>
  <td>$1,594</td>
  <td>$1,430</td>
  <td>$1,398</td>
</tr>
<tr>
  <td>t3.large</td>
  <td>$9,136</td>
  <td>$6,401</td>
  <td>$5,743</td>
  <td>$5,615</td>
</tr>
<tr>
  <td>c5.xlarge</td>
  <td>$18,727</td>
  <td>$13,122</td>
  <td>$11,772</td>
  <td>$11,510</td>
</tr>
<tr>
  <td>c4.8xlarge</td>
  <td>$176,425</td>
  <td>$123,621</td>
  <td>$110,905</td>
  <td>$108,433</td>
</tr>
</tbody>
</table>
{{< /rawhtml >}}

These figures are obtained by multiplying the reserved instance cost back in.
There's some discrepancy here as the on-demand markup isn't exactly 1.6x for all instances.

## Other types of reservations

AWS also offers three-year reservations and reservations with different payment terms.
I don't think these meaningfully change the previous analysis, but I'll talk through them.

Each of these options can further reduce the reserved instance price, which lowers the break-even point.
This will reduce the number of on-demand instances you'll want to use, causing you to auto-scale less.

### Three-year reservations

You've probably noticed that EC2 offers three year reservations as well, at an even further discount.
I usually avoid these.
Three years is a long time to lock in your capacity and there's a lot that can changes in that time.
Here's some things to keep in mind:

* You may release new features or experience new usage patterns, causing a different instance type to be optimal
* AWS may launch new instance types, which are usually much cheaper
* Your service may experience decreased load if customer needs change

Capacity planning is about predicting the future.
You'll never be able to predict it perfectly, but some predictions are safer than others.

### No upfront, partial upfront, full upfront

Amazon marketing considers full upfront reserved instances to be "discounts", where you can save by paying more up front.
As before, we can shift our thinking and consider these to be markups, with full up front being the default option.
Under this model, the no upfront reservation charges a premium to let you pay in installments.

Prepayment generally gets you a 6.7% discount (1 year reserved, no upfront vs full upfront), although there's some variation again:

{{< figure src="prepayment.png" alt="A graph showing a line that mostly stays at 0.93" >}}

I don't think these variants are too interesting from a DevOps perspective, it's just a question of finances.
If you've got cash "burning a hole in your wallet", pay up front to see a cost savings.

Choosing full upfront will change the "on-demand markup" to 1.7x, so you'll want to adjust your models.
The break even point on a daily basis is lowered to 14.1 hours, making it slightly less desirable to auto-scale.

## Over- and under-estimates

If you over estimate your capacity needs, then you'll have too many reserved instances.
Compared to an optimal allocation, you'll miss out on 0.0667 C savings for each instance-hour.

If you underestimate your capacity needs, then you'll have too few reserved instances.
Compared to an optimal allocation, you'll overpay at 0.0667 C for each instance-hour.

If you experience growth, you may have an opportunity to reserve additional instances.
But be careful about having too many reservations that end at different times of the year.
At some point you'll need to end your usage of this instance type.
Timing your instance type upgrade based on reservation expiration lets you maximize your value, but you'll want all your reservations to end at the same date.

Intentionally over-estimating capacity needs has it's own benefits.
You'll have more stable costs if you use fewer on-demand instances.
You can limit your worst case scenario costs by putting a cap on your auto-scaling.
Using extra reserved instances can reduce that worst case cost.
This is helpful if you need your projected budget to be close to your actual bill.

## Cloud-wide capacity issues

Something to watch out for is that on-demand instances may not always be available.
All cloud providers have capacity limits, and sometimes the entire availability zone can reach these.
This may be more common with smaller regions, uncommon instance types, or during certain busy times of the year.
You're also more likely to see this with certain deployment patterns; like deploying to a full fresh set of instances, cutting traffic to the new set, and then terminating the old set.
This pattern causes you to temporarily have twice the instance count.

## Spot instances

I've ignored spot instances so far.
These are harder to work with and harder to optimize ([instance weighing can require careful application profiling](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-mixed-instances-groups-instance-weighting.html), for example).
The prices are more variable, so it's harder to reason about and model these costs.
You also need to be OK if you're not able to get a spot instance when you need it, which works OK for background jobs but not for typical web server load.

> "We strongly warn against using Spot Instances for these workloads or attempting to fail-over to On-Demand Instances to handle interruptions." *-- [Best practices for EC2 Spot](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-best-practices.html)*

## Conclusion

I hope I've helped explain the dynamics of EC2 pricing and made it a little easier to think about optimization strategies and their impact.
This sort of analysis should work on other cloud service that use similar billing models, but be sure to model your actual load and the markups.
Good luck!

