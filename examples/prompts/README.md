# Example Prompts for AI Video Generation

These prompts are designed to work with Claude Code + FrameForge Agent Skill.
Each produces a deterministic, high-quality MP4 video.

---

## 1. Title Card

**Prompt:** "Create a 5-second title card video that says 'My Project' with a subtitle 'Built with FrameForge'. Dark background, white text, fade in the title first, then the subtitle."

**Expected:** Title fades in at 0.5s, subtitle at 1.5s, accent bar expands between them.

---

## 2. Feature Showcase

**Prompt:** "Make a 10-second video showcasing 5 features. Each feature should appear as a card that slides in from the bottom, staggered 0.5s apart. Use a dark blue gradient background."

**Expected:** 5 colored cards stagger in from below with fade + slide animations.

---

## 3. Data Visualization

**Prompt:** "Create a bar chart animation showing quarterly revenue: Q1=$12M, Q2=$18M, Q3=$15M, Q4=$24M. Bars should grow from zero, staggered. Add labels."

**Expected:** 4 horizontal bars grow to proportional widths with value labels.

---

## 4. Social Media Intro

**Prompt:** "Generate a 3-second YouTube intro in 1080p. Show a logo that scales in with a bounce, then a tagline fades in below."

**Expected:** Circle/logo scales with spring easing, text fades in underneath.

---

## 5. Countdown Timer

**Prompt:** "Make a 5-second countdown from 5 to 1, each number should scale in and fade out before the next appears."

**Expected:** Numbers 5-4-3-2-1 appear centered, each with scale+fade transition.

---

## 6. Code Walkthrough

**Prompt:** "Create a video that shows a code snippet appearing line by line, like someone is typing it. Use a dark code editor theme, monospace font."

**Expected:** Lines of code appear sequentially with typing effect on dark background.

---

## 7. Comparison Side-by-Side

**Prompt:** "Make a before/after comparison video. Left side labeled 'Before' with red tint, right side labeled 'After' with green tint. Both sides fade in simultaneously."

**Expected:** Split screen with contrasting colors, labels, and synchronized fade-in.

---

## 8. Animated Logo Reveal

**Prompt:** "Create a logo reveal animation: a circle expands from center, then the company name 'ACME' appears with a slide-up animation."

**Expected:** Circle scales from 0 to full size, text slides up through it.

---

## Tips for Good Prompts

1. **Specify duration** — "5-second video" or "10 seconds long"
2. **Mention resolution** — "1080p" or "YouTube Shorts format (1080x1920)"
3. **Describe timing** — "title appears at 1 second" or "staggered 0.3s apart"
4. **Name colors** — "dark blue background" or use hex like "#1a1a2e"
5. **Reference animation style** — "fade in", "slide from left", "scale with bounce"
