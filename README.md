# Davis Cattlelog
Ever wanted to see how software gets scaled to 50K+ users? From frontend, backend, DB, data engineering, and infrastructure? Worry no more! I founded Cattlelog, and I'm sharing this open-source version free to use, reference, and fork for whatever use you have. I encourage every student to try to replicate this sort of project for their community, whether in Davis or at any school!

Take a look at how ETL pipelines are managed and how data is captured from online sources using Airflow, or how data is cached using a Rust layer, or how analytics and A/B testing are managed using PostHog! Whatever you are interested in, there is something for you in this repo! Happy hacking!

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)

[![Website](https://img.shields.io/badge/Cattlelog-daviscattlelog.com-blue?style=flat)](https://daviscattlelog.com/)
[![My LinkedIn](https://img.shields.io/badge/LinkedIn-benedict--nursalim-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/benedict-nursalim/)
[![My Portfolio](https://img.shields.io/badge/Portfolio-benedictn.com-black?style=flat)](https://www.benedictn.com/)

## Sub-Projects

#### Environment Configuration

The frontend uses environment-specific configuration files:

- `.env.development` → Development environment (default)
- `.env.production` → Production environment
- `.env.development.local` → Local overrides (gitignored, overrides `.env.development`)

> [!IMPORTANT]
> Create `.env.development.local` to customize your local development. It will automatically override values from `.env.development` when running `npm run dev`.

**Scripts:**

```sh
npm run dev   # Uses .env.development
npm run prod  # Uses .env.production
```

#### Installation Virtual Env

1. Create a virtual environment:

```sh
python3 -m venv venv
```

2. Activate the virtual environment:
   
Mac & Linux:

```
source venv/bin/activate
```

Windows:

```
venv\Scripts\activate
```

3. Install the required packages:

```sh
pip install -r requirements.txt
```

### Extension v1 (WebExtend)

We have a Chrome extension written in TypeScript that allows users to import their schedule to g-cal or cattlelog.

Both the import to g-cal and import to cattlelog are in development.

### Gradient

Grade data server experiment in Elixir.

Research Question: Can serving grade data JSON from a server running on the Erlang VM have significant performance benefits over FastAPI in Python?

Tentative Result: There isn't enough evidence to suggest that this causes significant improvements, but more experimentation is needed.

See more [gradient docs](./gradient/README.md)

### Neptune

Learn more about the [8x speed increase](https://jr0.org/posts/optimizing-course-api/).

## Docs

### 1. Feature Flags & A/B Testing

#### 1.1 What are feature flags

Feature flags allow you to turn on and off functionality on an application without editing the structure of any code. When you turn on or off functionality, it's usually done with a boolean value being set to either true or false. It's also common to have feature flags toggled on or off remotely by something like [PostHog](https://posthog.com/) or your own A/B testing service. For instance, you can have your backend serve you a config JSON that describes which features should be enabled.

For example, we use a feature flag to enable and disable our referral code checking. The feature flag is defined as `FEATURES` and we create a feature called `referral_code`. When `referral_code` is true, we will run the logic associated with the referral code, but when it's false it will not be run.

```tsx
const FEATURES = {
  referral_code: false,
};

const LandingPage = () => {
  let join_code: string;

  {/* Check if the feature should be enabled */}
  if (FEATURES.referral_code) {

    const { refId } = useParams<{ refId: string }>();

    {/* More referral code logic */}
  }

  {/* ... */}
}
```

#### 1.2 A/B Test and PostHog Example

Here is an example of feature flags implemented using PostHog. This code was actually involved in an A/B test that **increased the usage of the grade distribution feature by 50%**. PostHog randomly picks users to be in either A or B group and shows them the website with either the feature on or of depending on group. We can then see the effect this has on the users, and in this case, users were **50% more likely** to go on and use the grade distribution feature. After we got these statistically significant results with over 260 unique users, we set the feature to always be on to get that 50% increase with everyone who visits the website. This has contributed to the grade distribution feature having been used over 2,400 times as the of the time of writing, which surpasses the professor page clicks of over 1,400, despite professor clicks predating grade distribution. Tests like these help us confidently steer our product based on tests and empirical data.

```ts
if (
    posthog.getFeatureFlag(
    "new-label-and-animation-on-view-grade-dist-button")
    === "new-label-and-animation"
) {
    setIsAnimatingButton(true);
}
```

#### 1.3 Why do we use feature flags

Having a quick way to toggle features is very convenient, especially early on in a product when you just want to test a bunch of variations of an idea. Feature flags in combination with A/B testing can also tell you a lot about how real users interact with your product. Lastly, if you do ship a feature that breaks in production, it's very easy to turn the feature off temporarily.

#### 1.4 How do feature flags relate to A/B testing

A/B testing is the idea of displaying different variations of feature, layout, or design and learning how said change plays into metrics. A classic example is "which style of 'buy now' button do users click more?". When you build feature flags into your code, you can very easily build and deploy these tests.

#### 1.5 A/B testing results

The following results happened with a sample size over 100 unique users per variant and gaining a confidence level great enough to consider all of these results statistically significant.

1. Experiment: By changing the text in the search box from "search" to "search for classes", we got a **20%** increase in searches across the platform contributing to the **32,000+** searches.
2. Experiment: By changing the style of the grade dist. button we got a **48%** increase in grade dist. button clicks contributing to the **5,000+** grade dist. page views.

Additional information about [Adding A/B Testing with PostHog](https://jr0.org/cdn/Adding-A-B-tests-to-PostHog.pdf).

### 2. Formatting & Linting

#### 2.1 What we use for frontend formatting

We use the default settings for `prettier`, a tool that automatically formats out code.

To run prettier in the current directory, run the following:

```sh
prettier --write .
```

We also run a `prettier` check in our CI.

```sh
prettier "**/*.{js,jsx,ts,tsx}" --ignore-path .prettierignore --check
```

#### 2.2 What we use for backend linting and formatting

We use `ruff` for linting the backend code.

We run `ruff` as:

```sh
ruff check
```

This should be done before the final commit of a pull request (or any time during).

We also run `ruff` in the CI and we include the `--exit-zero` so that the check does not fail if the linter fails. We will in the near future remove this flag once we have followed the exact formatting guide. We are doing incremental adoption but will strictly enforce linting soon.

Formatting with Ruff can be done like this:

```sh
ruff format *
```

### 3. Naming

#### 3.1 Branch naming

-   Please name branches to have a good level of detail about what they do
-   Generally use a verb and another noun or two (see good examples below)
-   Make sure to use [Kebab case](https://developer.mozilla.org/en-US/docs/Glossary/Kebab_case) for branch names and branch names only

Good branch names:
-   remove-class-post-route, document-tags-file, and place-database-calls

Bad branch names:
- new, dev, Something, and fix

#### 3.2 Variable naming

- Please use descriptive variable names
- The length of a variable's name should be to the scope it can be used in (E.g. `i` in a small for loop, `computed_vectors` for a whole function scope)

#### 3.3 Function naming

- The length of a function's name should be **inversely** propositional to the scope it can be used in (E.g. `fetch_classes` is used in the whole `pages` directory but `update_button_on_submit` is just inside a single component)

The rational here is that if you are allowing a function to be used in a whole module, it should do something pretty basic and self explanatory, whereas something specific like updating a specific state of a component, should not be able to be used outside the relevant scope.

### 4. Style

#### 4.1 Comments

- Comments should start with a capital letter for the first word unless it is case sensitive text (E.g. an identifier or a keyword)
- Comments should almost always come before the line they are describing
- Occasionally it makes more sense to put a comment after a line, so if this is the case, add two spaces between the start of the comment and the end of the line of code
- Comments should almost always describe WHAT or WHY the code is doing what it's doing
- Sometimes it does make sense to write a comment about HOW you are doing something
- Comments should include only characters that can be typed with a standard keyboard; or if absolutely necessary characters from other scripts including emoji. This excludes symbols to split up code like the non-standard dash seen below

### 5. Development Process

![Circular Development](https://jr0.org/images/Circular%20Development%20-%20Git%20Flow.png)

#### 5.1 Git setup

To insure a uniform setup across the team so that when I run a command, it does the same thing on your machine, we all use the same names for our remotes.

git switch -c <my-feature-branch>

### 6. Testing

#### 7.1 Backend Tests

We use [Pytest](https://docs.pytest.org/en/stable/) for running our tests. Pytest is extremely simple to run and create tests.

Here is an example test with pytest:

```py
def test_parse_course_id():
    assert ("MAT", 21, "C") == parse_course_id("MAT21C")
    assert ("MAT", 21, "C") == parse_course_id("MAT021C")
    assert ("ENG", 3, "") == parse_course_id("ENG003")
```

Pytest uses the default assert statement and does some type of overwriting to make its functionally extended.

You can then run the tests with the command `pytest`, but make sure to source the `venv`.

```
backend (main) λ source venv/bin/activate
(venv) backend (main) λ pytest
======================================================= test session starts ========================================================
platform linux -- Python 3.12.7, pytest-8.3.4, pluggy-1.5.0
rootdir: /course-recommender/backend
plugins: anyio-4.6.2.post1, langsmith-0.3.7
collected 2 items

tests/test_utils.py ..                                                                                                       [100%]

======================================================== 2 passed in 0.19s =========================================================
(venv) backend (main) λ
```

Here we can see that both tests passed!

Pytest has a few requirements:

1. You need to have your test name start with `test` (e.g. `test_parse_course_id`)
2. The test files also need to start with `test` (e.g. `test_utils.py`)
2. You need a `__init__.py` in the folder with the tests, but that's already created

#### 7. Analytics

#### 7.1 Validating marketing and utm source

Adding `?utm_source=anything` after any url for Cattlelog, allows us to track when that link was used. This means that for links we share via email, we can send the email with the link `daviscattlelog.com?utm_source=aw-april-email` and see how many people clicked the link, how many pages they clicked, etc.

I encourage everyone to add a unique tag for every different use case with a specific and unique text tag, especially with QR codes.

This improves our ability to make data driven decisions and test marketing empirically.

#### 7.2 Adding share buttons

More writing should be added here later but suffice it to say, the most inbound traffic from any utm_source link comes comparison_share -> `886` in first place and cory_share -> `125` in fourth place (Added later). These features built in to the product are generating links that people are sharing with their friends. Their numbers represent the amount of times that link was clicked. Gettting more than 1000 clicks from share links in features has been greatly helpful for market adoption.

As of October 2025, these links have generated over 2,000 page views.

#### 7.3 Performance Analytics with Kronicler

We use [Kronicler](https://github.com/JakeRoggenbuck/kronicler) to capture performance analytics for our backend.

Here is what the [Kronicler Dashboard](https://usekronicler.com) looks like.

##### 7.3.1 Setup / Install Kronicler

Kronicler is installed with the other Python packages in the `requirements.txt`.

It can also be done manually with:

```
pip install kronicler
```

To use the dashboard, navigate to the website, and put in this URL into the settings:

```
https://course-recommender-backend.onrender.com/api/logs
```

##### 7.3.2 Uninstall / Disable Kronicler

If you'd like to disable Kronicler, you can uninstall it or not install it to begin with and the server will work without it.

```
pip uninstall kronicler
```

We automatically detect kronicler and skip its usage when it's not installed.

```py
try:
    import kronicler
    KRONICLER_AVAILABLE = True
except ImportError:
    KRONICLER_AVAILABLE = False
```

### 8. Misc Docs

#### 8.1 The different config files

| filename           | what                      | link                                                             | state (is deprecated?)             |
| ------------------ | ------------------------- | ---------------------------------------------------------------- | ---------------------------------- |
| eslint.config.js   | eslint config             | https://eslint.org/docs/latest/use/configure/configuration-files | OK                                 |
| postcss.config.js  | default                   | https://postcss.org/                                             | OK                                 |
| tailwind.config.js | colors/sizes/fonts config | https://tailwindcss.com/docs/configuration                       | OK                                 |
| vercel.json        | vercel settings           | https://vercel.com/docs/projects/project-configuration           | OK                                 |
| vite-env.d.ts      | interfaces for env vars   | https://vite.dev/guide/env-and-mode#intellisense-for-typescript  | OK                                 |
| vite.config.ts     | default vite              | https://vitejs.dev/config/                                       | OK                                 |
| dockerfile         | docker for the backend    | https://docs.docker.com/reference/dockerfile/                    | OK                                 |

#### 8.2 Routes docs

Docs for the backend endpoints are available at https://course-recommender-backend.onrender.com/docs

#### 8.3 Language Specific Resources

Read through the [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/2/basic-types.html) for learning the frontend language. For the backend, you can look through [Real Python](https://realpython.com/) or really any tutorial for Python is okay. For Rust to learn the language for Neptune, you can use [Rust Book](https://doc.rust-lang.org/stable/book/). 

### 9. Internal Tools

#### 9.1 QR Tool

You can visit our main QR code tool by going to [daviscattlelog.com/qr](https://daviscattlelog.com/qr).

This tool is meant to help with marketing campaigns to both make static QR codes and to add UTM Source trackers to the links.

The base URL is just the Cattlelog URL by default, so no need to change anything. You can then add a UTM Source string. Make this a unqiue string using Kabob case (`just-like-this`).

Adding a string will show you a QR code image that you can just directly download. You can also see the URL below the image to make sure it generated correctly.

These QR codes will never expire and they are able to track each visit.

#### 9.2 Grade Dist. QR

This one is less hidden than the last but it still is considered an internal tool. On the grade distribution page, there is a button that says "Show QR" that allows you to automatically generate a QR code with a tracking link for a specific grade dist page.

#### 9.3 `upload_data.py`

The `upload_data.py` script is used to add our JSON to the R2 bucket. This essentially is an CDN as a cache and it loads 6.37 times faster than our backend.

#### 9.4 `make_sitemap.py`

The `make_sitemap.py` script uses the output from our backend to automatically make a sitemap.

#### 9.5 `get_giveaway_emails.py`

To get the emails that signed up for the giveaway, use this script.

#### 9.6 `data_speed_test.py`

The data speed test script is used to check the speed of the backend compared to our R2 bucket cache solution.

#### 9.7 `word_cloud.py`

A word cloud can help to understand your audience and is a visualization that shows relieve frequency of text. From this word cloud, what is being searched. Overwhelmingly, it's course code prefixes. Furthermore, it's specific technical majors like mat, ecs, bis, sta, and che. This insight lets us know how people are using our search feature and can inform changes to our product. This image is based on over 300,000 searches.

![Word Cloud](./scripts/search_word_cloud.png)

## Contributers
- Ami Sheth
- Angela Lee
- Bardia Anvari
- Benedict Nursalim
- Eugene Cho
- Jake Roggenbuck
- Jamie Kim
- Jason Zhang
- Rani Saro
- Veronica Hangsan
- Winnie Situ
