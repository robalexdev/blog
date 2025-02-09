---
title: Choosing Vim over VSCode
slug: vim-over-vscode
date: 2025-02-08
summary: Why I keep coming back to Vim
params:
  categories:
  - Vim
  - VSCode
  - Programming
  - Editors
---

You've probably noticed that VSCode is very popular among programmers.
As I drop into a Vim session, yet again, I wonder if I'm missing something.
What keeps me coming back to Vim?


## Visual comparison

Here's the roughly same view as seen in VSCode versus Vim.
I'm working on a python file (sql.py) which is reading some content written by a go file (sql.go) from another project.
This is exploratory code for [a project I've written about before](https://alexsci.com/blog/blogroll-network/).
I have a SQLite shell open so I can explore the schemas and table content.
And I usually keep an extra terminal open for one-off commands.

{{< figure
src="vscode-example.png"
alt="Screenshot of VSCode showing the many tool bars"
title="VSCode screenshot"
>}}

{{< figure
src="vim-example.png"
alt="Screenshot of Vim showing a text focused view"
title="Vim screenshot"
>}}


## VSCode has lower information density

It took me a couple tries to make a screenshot that was fair to VSCode.
Initially, I had a terminal on the bottom of two side-by-side editor views.
This left tons of white space at the ends of lines and made the terminal tiny.
I had to look online to figure out how to move my VSCode buffer.
I needed to click on "Terminal" and then a hidden menu would open.
One of the alleged benefits of using an IDE like VSCode is the low learning curve and mouse-based controls, but that falls apart when things are hidden.

Even after spending a couple minutes trying to size things, VSCode is still showing less information:
* The file I'm working on (sql.py) shows 47 lines in VSCode versus 53 in Vim.
* I'm using the SQLite shell as a primary reference, so I put it in a big buffer in Vim
* I'm using sql.go as a secondary reference, so I put it in a small buffer in Vim
* VSCode keeps terminals and code separate, so I can't optimize my view

The Vim screenshot even shows that I have another tab of my terminal editing my blog (using Vim).
The density is much better, and much easier for me to control.


## VSCode is trying to tell me all the wrong things

### Multiple workspace challenges

You may have noticed that VSCode is complaining about errors in my Go code.
VSCode is trying to be smart, so it's linting my Go.
This could be a helpful feature, but it's confused about my workspaces.
VSCode can't figure out that ../feed2pages-action/sql.go uses ../feed2pages-action/util.go.
So now I have these squiggly lines all over my code, because VSCode is wrong.

Perhaps I should open two windows, one for each project, and put them side by side?
This makes me wonder if the trend towards mono-repos is driven partly by people fighting with VSCode.


### Attention grabbing badges

I also notice that there are some badges on the left side of the screen trying to catch my attention.
What could be so important?
Ah, Microsoft wants me to restart VSCode for some updates.
No thanks... I'm trying to write code.

Writing code takes a lot of focus, eliminating noise is really important to me.


## VSCode Vim isn't Vim

I've built up a ton of muscle memory around Vim commands.
So installing Vim keybindings is my go-to when ever I try a new IDE.
This keeps me sane as I can `/find` and `dd` as with Vim proper.
But the Vim plugin is always some weak subset of Vim, or conflicts with built-in IDE hotkeys.


### Sizing views

I've built up a ton of muscle memory around optimizing my views.
I like to have a bunch of buffers open with the files I'm working on or referencing.
Being able to quickly split a view in a way that makes sense to me is great.
If I need to see more of a buffer I'll `^W |` `^W _` it full size.
On Vim this works with all buffers, including terminal buffers.

But VSCode Vim doesn't implement these.
Editor views can support some Vim resizing commands, but not others.
Terminal views don't seem to support Vim commands at all.

This means my terminal and editor views can't intermix.
If I want to resize the terminals, for example, I need to carefully hover over the tiny (three pixel?) border between views and then click and drag.
Managing views on the screen is a pain with VSCode.


## I can live in a shell

My typical workflow starts by opening a shell.
It gives me ready access to open files, check my git status, or use other tools.
I've done lots of DevOps work where I need to interact with bare-bones remote systems over SSH, so shell command already flow from my fingers.

Once I open Vim, I tend to `:ter` to open a shell and then work from inside Vim.

Remote development is where Vim shines.
I could try to use VSCode Remote Development, but I wouldn't want to use that to connect to a "production" system.
So, I'm back to using the tools I can find on the system.
Knowing Vim is really helpful because it's almost always installed and it's miles ahead of other pre-installed editors like Nano.


## What about VSCode's killer feature: Copilot?

It's not for me.

I'm pretty unimpressed with how LLMs have been marketed.
They are an amazing technology, absolutely.
But I think they are harmful in a lot of the ways people are trying to use them.

A week back I came across a comment mentioning that the poster liked asking "Write a password generator" as an interview question.
It's easy until you realize you should account for archane rules like "no repeating letters".
I gave it to ChatGPT's GPT-4o, the same model Copilot uses, to see if it could pass the interview.
What stood out is that
[I kept needing to remind it of the rules](https://chatgpt.com/share/67a81341-8b9c-800e-a51b-317ed892c54b).
Eventually, I gave up as I ran out of GPT-4o credits (and I'm not gonna pay for this).
[The last output reverted a previous fix](https://chatgpt.com/canvas/shared/67a8130fce9c81918c4ed36671306c78) yet again.

GPT-4o writes code that looks quite decent (especially for "interview coding"), but it really struggled to keep track of requirements and leaned on me to do careful code reviews.
A human usually writes better code than what you see in the interview, but this is the best GPT can do.
I'd be pretty upset if a junior developer kept sending me code reviews that added and removed previously discussed fixes, never producing all of them together.
For a junior developer, I'd tolerate some back-and-forth as I'm training them to improve their craft.
But for Copilot?
I'm not interested in volunteering to train AI to write code, and the code quality isn't enough to make it a fair trade.

I totally understand the appeal for "boiler-plate" coding, or for people learning how to code.
But as an experienced software developer it just slows me down.


## Vim is not going to go away

I've seen a number of editors grow popular and then wane.
At various times I've seen Emacs, Eclipse, IntelliJ IDEA, Atom, SlickEdit, gedit, Notepad++, Sublime, NetBeans, Visual Studio, Xcode, IDLE, PyCharm, Android Studio, and more.
Some of those aren't around any more.
I'm not worried about Vim getting eaten by a big tech company, or enshittified to feed advertising or AI ambitions.


## Would I recommend Vim to others?

VSCode seems like easy mode, so I fully understand that people gravitate towards it.
Vim has a steep learning curve, and honestly after around 12 years of using it I'm still learning (`zg` to add things to the spell check dictionary is a recent one).
I'm glad I invested time in learning Vim; it's paid off.
So I think others would similarly benefit if they started today.

