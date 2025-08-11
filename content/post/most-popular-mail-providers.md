---
title: The most popular email providers
date: 2025-08-11
summary: Measuring the popularity of email hosting providers
params:
  categories:
  - SMTP
---

{{< rawhtml >}}
<style>
thead td {
  font-weight: bold;
}

th, td {
  padding: 0.5em;
}

table {
  text-align: left;
  padding-bottom: 3em;
}

td:nth-child(1) {
  text-align: right;
}

</style>
{{< /rawhtml >}}

I downloaded the [Tranco list](https://tranco-list.eu/) of top domain names and ran DNS MX lookups to detect mail servers.
I used the top 100,000 domain names, which should be a reasonably sample of large and popular sites.
I found that 72% of the scanned domains had a mail server configured (MX record was present).

Here are the most popular email hosting platforms, as of August 2025.
I've aggregated by the second-level domain name of the MX records, then truncated to providers supporting at least 25 of the scanned domain names.


| Domain count | Hosting provider |
| ------------ | ---------------- |
|21,750|google.com|
|13,084|outlook.com|
|8,807| googlemail.com|
|3,289| pphosted.com|
|1,676| mimecast.com|
|1,054| amazonaws.com|
|967|  cloudflare.net|
|865|  yandex.net|
|825|  registrar-servers.com|
|638|  zoho.com|
|586|  iphmx.com|
|485|  qq.com|
|455|  mailgun.org|
|420|  barracudanetworks.com|
|372|  secureserver.net|
|287|  mail.ru|
|253|  emailsrvr.com|
|246|  ovh.net|
|218|  trendmicro.com|
|204|  hostinger.com|
|202|  yandex.ru|
|198|  messagingengine.com|
|195|  ppe-hosted.com|
|192|  protonmail.ch|
|175|  privateemail.com|
|168|  mxhichina.com|
|161|  zoho.eu|
|158|  messagelabs.com|
|150|  invalid|
|139|  gandi.net|
|139|  feishu.cn|
|120|  aliyun.com|
|119|  mxrecord.io|
|112|  trendmicro.eu|
|101|  improvmx.com|
|98|   netease.com|
|97|   securemx.jp|
|96|   mxrecord.mx|
|93|   hornetsecurity.com|
|81|   fireeyecloud.com|
|80|   sophos.com|
|80|   hostedemail.com|
|78|   mailcontrol.com|
|70|   forwardemail.net|
|70|   mx.microsoft|
|69|   zoho.in|
|67|   spamexperts.com|
|66|   amazon.com|
|65|   amazonses.com|
|65|   mailhostbox.com|
|64|   beget.com|
|63|   jellyfish.systems|
|63|   titan.email|
|60|   mimecast.co.za|
|58|   sendgrid.net|
|58|   mailspamprotection.com|
|58|   mailchannels.net|
|57|   None|
|56|   mxrouting.net|
|54|   hostinger.in|
|53|   spamexperts.eu|
|52|   dfn.de|
|52|   arsmtp.com|
|52|   spamexperts.net|
|50|   ispgateway.de|
|49|   mailanyone.net|
|47|   renater.fr|
|46|   larksuite.com|
|46|   cscdns.net|
|44|   yahoodns.net|
|44|   kagoya.net|
|42|   mailgw.nic.in|
|40|   locaweb.com.br|
|39|   gpphosted.com|
|38|   mailbox.org|
|37|   ionos.de|
|36|   register.it|
|35|   migadu.com|
|35|   pair.com|
|35|   163.com|
|34|   reg.ru|
|33|   oxcs.net|
|32|   1and1.com|
|31|   psmtp.com|
|31|   email-messaging.com|
|30|   timeweb.ru|
|30|   fortimailcloud.com|
|30|   retarus.com|
|30|   daum.net|
|28|   iberlayer.com|
|27|   alibaba-inc.com|
|27|   mx25.net|
|27|   worksmobile.com|
|26|   renr.es|
|26|   mgovcloud.in|
|26|   your-server.de|
|25|   seznam.cz|
|25|   dreamhost.com|
|25|   hiworks.co.kr|
|25|   serverdata.net|


Google and Microsoft grab the top spots, acting as email provider for about 60% of the email-enabled domains analyzed.
A diverse group of hosting providers, registrars, email and security products form the long-tail.


[The scanning code is available on GitHub](https://github.com/robalexdev/mail-server-security-scanner)

