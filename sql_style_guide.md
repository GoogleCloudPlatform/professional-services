```
# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
```

# Google SQL Style Guide

[TOC]

## Source file basics

### File name

File names must be all lowercase and may include underscores (_) or dashes (-),
but no additional punctuation or spaces. Follow the convention that your project
uses. Filenames’ extension must be .sql.

### Whitespace characters

Aside from the line terminator sequence, the ASCII horizontal space character
(0x20) is the only whitespace character that appears anywhere in a source file.
This implies that

1.  All other whitespace characters in string literals are escaped, and
2.  Tab characters are not used for indentation.

Additionally:

1.  **NO** whitespace inside parentheses, brackets or braces.
2.  **NO** whitespace before a comma, semicolon, or colon.
3.  <code>YES</code> do use whitespace after a comma, semicolon, or colon except
    at the end of the line.
4.  <code>YES</code> do always surround operators with a single white space such
    as “=” or “==”

### Non-ASCII characters

For the remaining non-ASCII characters, either the actual Unicode character
(e.g. <code>∞</code>) or the equivalent hex or Unicode escape (e.g.
<code>\u221e</code>) is used, depending only on which makes the **code easier to
read and understand.**

| Example                             | Discussion                             |
| ----------------------------------- | -------------------------------------- |
| WHERE column_a = '<code>μs</code>'; | Best: perfectly clear even without a   |
:                                     : comment.                               :
| WHERE column_a =                    | Allowed, but there’s no reason to do   |
: '<code>\u03bcs</code>'; -- 'μs'     : this.                                  :
| WHERE column_a =                    | Allowed, but awkward and prone to      |
: '<code>\u03bcs</code>'; -- Greek    : mistakes.                              :
: letter mu, 's'                      :                                        :
| WHERE column_a =                    | Poor: the reader has no idea what this |
: '<code>\u03bcs</code>';             : is.                                    :

### File documentation

Start each file with a SQLDoc (<code>/** ... */</code> style) comment to
describe its purpose.

Implementation comments should have a different style, see [Comments](#comments)
section for more details.

~~~sql {.good}
/** A one line summary of the file contents. */
~~~

~~~sql {.good}
/**
 * A one line summary of the file contents.
 *
 * Leave one blank line.  The rest of this docstring should contain an
 * overall description of the file.
 */
~~~

## Formatting

### Block indentation: +2 spaces

Each time a new block or block-like construct is opened, the indent increases by
two spaces. When the block ends, the indent returns to the previous indent
level. The indent level applies to both code and comments throughout the block.

Block indent should be relative to first non-whitespace character on the
previous line.

The only exception is indent for function and macro arguments, which should be
4-spaces.

~~~sql {.good}
/* Correct */

SELECT
  TABLE_A.column_one,  -- Indent by 2 spaces.
  TABLE_A.column_two,
  TABLE_B.column_three,
  SUM(
      IF(
          -- 4-space indent
          TABLE_B.column_three = TABLE_B.column_four,
          1,
          0))
FROM
  -- Always place sub-selects in a separate indented () block.
  (
    SELECT
      column_one,
      column_two
    FROM D
  ) AS TABLE_A
INNER JOIN
  TableB AS TABLE_B
  ON TABLE_A.column_one = TABLE_B.column_one
WHERE
  ...  -- Indent by 2.
GROUP BY
  ...  -- Indent by 2.
ORDER BY
  ...  -- Indent by 2.
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
    TABLE_A.column_one,  -- 4-space indent, instead of 2.
    TABLE_A.column_two,
    SUM(
      IF(  -- 2-space indent, instead of 4.
        TABLE_B.column_three = TABLE_B.column_four,
        1,
        0))
FROM (  -- Should move to next line with indent
         SELECT a, b, c, d FROM D  -- 4-space indent, instead of 2.
     ) AS TABLE_A
INNER JOIN
  TableB AS TABLE_B
    -- Do not indent when line-wrapping an already indented expression,
    -- unless it is one of multiple arguments to a function.
    ON TABLE_A.column_one = TABLE_B.column_one;
~~~

#### More common indentation examples

~~~sql {.good}
/* Correct */

CASE
  WHEN ... THEN
  WHEN ... THEN
  END AS column_one

CASE
  -- If WHEN/THEN does not fit on one line, indent THEN
  WHEN ...
    THEN
  WHEN ..
    THEN
  END AS column_two
~~~

### Statements

#### Semi-colons are required

The end of every SQL statement must be terminated with a semicolon, and should
not be placed by itself on a new line. Relying on automatic semicolon insertion
is forbidden.

#### Column limit: 80

Each line of text in your code should be at most 80 characters long. The limit
can be exceeded if syntactically necessary, e.g., for a long string.

#### Line-wrapping

**Terminology Note:** Line-wrapping is defined as breaking a single expression
into multiple lines.

There is no comprehensive, deterministic formula showing exactly how to
line-wrap in every situation. Very often there are several valid ways to
line-wrap the same piece of code.

NOTE: While the typical reason for line-wrapping is to avoid overflowing the
column limit, even code that would in fact fit within the column limit may be
line-wrapped at the author's discretion.

#### Use trailing commas

Include a trailing comma whenever there is a line break between the final
element.

~~~sql {.good}
/* Correct */

SELECT
  col_a,
  col_b,
  col_c
  -- Or all on a single line as col_a, col_b, col_c
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
  col_a
   ,col_b
   ,col_c
~~~

#### Boolean operator placement

If you have a long list of boolean operators, the boolean operator should be at
the beginning of each new line. If the boolean statement is short enough, it may
be put on a single line.

The exception to this rule is when a list of boolean operators appears within a
function; in such a case the boolean operator should be indented two spaces to
separate it from other arguments.

~~~sql {.good}
/* Correct */

...
WHERE
  has_positive_account_balance
  AND is_not_in_default
  AND has_fixed_rate_mortgage_product;

...
WHERE has_positive_account_balance AND is_not_in_default;

SELECT
  IF(
      has_positive_account_balance
        -- Indent by two spaces to nest under previous line
        AND has_fixed_rate_mortgage_product,
      'Is a great customer',
      'Could buy more products') AS displayed_customer_type
FROM
  TableA;
~~~

~~~sql {.bad}
/* Incorrect */

...
WHERE
  -- The boolean operator must be at the beginning of the line
  has_positive_account_balance OR
  is_not_in_default;

SELECT
  IF(
      has_positive_account_balance
      -- The boolean operator must be indented relative to the other
      -- function arguments.
      AND has_fixed_rate_mortgage_product,
      'Is a great customer',
      'Could buy more products') AS displayed_customer_type
FROM
  TableA;
~~~

#### Line breaks

You are only allowed one SQL clause per line, unless the entire SQL command that
includes that clause can fit on a single line.

For comma-separated lists (including function arguments), if the whole list
doesn't fit on one line, then add a line break after each comma. List items
should be vertically aligned.

~~~sql {.good}
/* Correct */

SELECT a, b, c FROM D;  -- Whole SELECT command fits on one line.

SELECT
  -- All column names fit on one line with correct indentation.
  long_column_name_one, long_column_name_two, long_column_name_three
FROM
  TableA
GROUP BY
  long_column_name_one, long_column_name_two, long_column_name_three;
~~~

~~~sql {.bad}
/* Incorrect */

SELECT a, b, c FROM D  -- FROM clause should be on a separate line.
WHERE ...
-- Reserved words that are always used together, such as GROUP BY, should
-- never be on separate lines.
GROUP
  BY ...

SELECT
  -- Disallowed, since all column names do not fit on a single line.
  long_column_name_one, long_column_name_two, long_column_name_three,
  long_column_name_four
FROM
  TableA
GROUP BY
  -- Disallowed, just like in the SELECT clause.
  long_column_name_one, long_column_name_two, long_column_name_three,
  long_column_name_four;
~~~

NOTE: Consistency is key. If you decide to add line breaks that are not required
by the style guide, make sure you apply these line breaks consistently
throughout your code.

~~~sql {.good}
/* Correct */

SELECT
  -- Line break is required, since these would not fit on SELECT line.
  long_column_name_one,
  long_column_name_two,
  long_column_name_three,
  long_column_name_four
-- The following is correct, since arguments fit on one line with the clause.
FROM TableD
WHERE long_column_name_one = long_column_name_two;

-- Although not required, you can always add a line break after each clause.
SELECT
  a, b, c
FROM
  TableD
WHERE
  a = b;
~~~

~~~sql {.bad}
/* Incorrect */

-- Ensure that your line breaks are consistent.
SELECT a, b, c
FROM
  TableD -- Inconsistent: has a line break, even though SELECT and WHERE do not.
WHERE a = b;
~~~

### Vertical whitespace

Minimize use of vertical whitespace. For example, one blank line should separate
statements, and two blank lines might separate related statements into groups or
different blocks of SELECT statements.

### Function and macro arguments

SQL function names must be written in UPPERCASE, and prefer to put all function
arguments on the same line as the function name. If doing so would exceed the
80-column limit, line-wrap the arguments in a readable way. To save space, you
may wrap as close to 80 as possible, or put each argument on its own line to
enhance readability. Args should be indented by four spaces.

~~~sql {.good}
SELECT
  -- This style is preferred, but other reasonable indentation practices are
  -- acceptable.
  FORMAT_TIMESTAMP(
      '%Y%m%d',
      TIMESTAMP '2008-12-25 15:30:00',
      'America/Los_Angeles') AS example_1,
  FORMAT_TIMESTAMP(
      '%Y%m%d', TIMESTAMP '2008-12-25 15:30:00',
      'America/Los_Angeles') AS example_2,
  -- Nested functions should be indented by an additional four spaces.
  CONCAT(
      FORMAT_TIMESTAMP(
          '%Y%m%d',
          TIMESTAMP '2008-12-25 15:30:00',
          'America/Los_Angeles'),
      FORMAT_TIMESTAMP(
          '%Y%m%d',
          TIMESTAMP '2008-12-25 15:30:00',
          'America/Los_Angeles')) AS example_3
FROM TableA;
~~~

### Comments {#comments}

Comments should usually be written as complete sentences with proper
capitalization and periods at the end. Shorter comments, such as comments at the
end of a line of code, can sometimes be less formal, but you should be
consistent with your style. Complete sentences are more readable, and they
provide some assurance that the comment is complete and not an unfinished
thought.

#### TODO comments

Use TODO comments for code that is temporary, a short-term solution, or
good-enough but not perfect. TODOs should include the string TODO in all caps,
followed by your username in parentheses, followed by a colon.

~~~sql {.good}
-- TODO(username): Update this query to improve performance. 
-- TODO(b/buganizer_id): This filter does not capture all business cases.
~~~

If your TODO is of the form "At a future date do something" make sure that you
either include a very specific date ("Fix by November 2005.") or a very specific
event ("Remove this code after finishing migrating to the III identifiers.").

#### Block comments

Block comments are indented at the same level as the surrounding code. They may
be in `/* ... */` or -- style. For multi-line `/* ... */` comments, subsequent
lines must start with `*` aligned with the * on the previous line, to make
comments obvious with no extra context.

NOTE: The `#` style comment is not recommended because not every query engine
supports them. Therefore prefer to use the style that can be applied
consistently across any SQL dialect. Additionally double hyphen (`--`) complies
with the ANSI/ISO standard for SQL.

~~~sql {.good}
/*
 * This is
 * okay.
 */

-- And so
-- is this.

/* This is fine, too. */

-- Also fine.
~~~

Comments are not enclosed in boxes drawn with asterisks or other characters.

Do not use SQLDoc (`/** … */`) for any of the above implementation comments.

#### Inline comments

Add two spaces between code and comment for inline comments.

~~~sql {.good}
SELECT column_one  -- Best column.
FROM TableA;  -- Nice table.
~~~

### Naming

Names should only use Latin-1 alphanumeric characters, begin with a letter, and
avoid use of numbers as much as possible. Names should contain at most
sixty-four characters because of MySQL's maximum name length limitation.

Naming conventions: `TableName`, `TableNameAlias`, `TABLE_NAME_ALIAS`,
`FUNCTION_NAMES`, `MACRO_NAMES`, `ColumnNames`, `column_names`, `RESERVEDWORDS`,
`CONSTANTS`.

#### Column Names

Columns which are the only primary key for a table are named after the table,
are singular, and end with `Id`. For example, the `Customers` table has
`customer_id` for its primary key. It's tempting to create a table called
`Users` only to call the primary key `uid`. Do not do it! `user_id` is much
easier to remember, and this also makes it much easier to write queries.

Boolean column names conventionally start with `Is`, e.g.,
<code>is_property_spam</code>. Use a count suffix for columns containing
cardinality information, e.g., <code>machines.disk_count</code>.

Use a num suffix for columns containing ordinality information, e.g.,
<code>machines.tray_num</code>.

Using “_” in column names is preferred over CamelCase column names. However,
given that some databases store columns names as one or the other, the main
guide here is to be consistent. Do not mix-match CamelCase column names with
column names containing “_”.

Example:

~~~sql {.good}
/* Correct */

-- Consistent naming style.
SELECT
  F1Database.customer_id AS customer_id,
  sqmDatabase.UserClicks AS user_clicks,  -- Convert column name to underscore.
  someOtherDatabase.some_column AS some_column
 ...
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
  F1Database.customer_id AS customer_id,
  sqmDatabase.Clicks AS Clicks, -- Inconsistent naming styles.
  someOtherDatabase.some_other_column AS some_other_column
  ...
~~~

#### Column name abbreviations

Good column names are as descriptive as possible, avoid abbreviations, e.g.,
<code>campaign_served_days</code>, not <code>camp_srv_days</code>.

Well-known acronyms are acceptable where necessary, e.g., <code>cost_usd</code>
and <code>ad_group_max_cpc</code>.

Based on the guide highlighted above, these could also become
<code>CampaignServedDays</code>, <code>CostUsd</code>, or
<code>AdGroupMaxCpc</code>.

#### Output columns

Separate `SELECT` statements' output columns by commas each followed by a space
or a newline. Also, use line breaks to separate columns into groups of related
items. Many readers prefer to list one item per line, especially if aliases are
present. Using [column aliases](#table-aliases) will have the same guidance as
using table aliases.

WARNING: Ensure you only select columns you actually need to avoid memory
wastage. In particular, avoid using `SELECT *` unless readability suffers when
listing all columns individually.

When using multiple statements to perform one task, consider writing a short
comment explaining each statement's purpose. These statements can serve as an
outline of the code, helping a reader quickly find a desired statement.

#### Table names

This section applies to tables given names within the scope of the a SQL script
by `DEFINE TABLE`, `DEFINE INLINE TABLE`, `WITH`, and variants thereof.

This section DOES NOT address the naming of 'permanent' tables. Permanent tables
should follow the style and standards of the datawarehouse in which they are
defined (e.g. defining a table in datascape/plx using `DEFINE PERMANENT TABLE`
should be named with snake_case).

Table names should be in camel case with one capital letter at the start of each
word, e.g., <code>ApprovalEvents</code>, not <code>Approvalevents</code> or
<code>approval_events</code>. Acronyms are considered a word, so use
<code>CtrClicks</code> and <code>IpAddresses</code>, not <code>CTRClicks</code>
and <code>IPAddresses</code>.

~~~sql {.good}
/* Correct */

DEFINE TABLE Roster '/cns/...';
DEFINE TABLE PlayerStats '/cns/...';

WITH SchoolIds AS (SELECT school_id FROM Roster),
     OpponentIds AS (SELECT opponent_id FROM PlayerStats)
SELECT * FROM SchoolIds
UNION ALL
SELECT * FROM OpponentIds;
~~~

~~~sql {.bad}
/* Incorrect */

DEFINE PERMANENT TABLE my_mdb_group.my_namespace.MyTable '/cns/...';
~~~

##### Pick a descriptive table name

The table name can be descriptive of the primary key. For example, a stats table
whose primary key is date and ad group ID would be called `DailyAdGroupStats`.
Alternatively, the name can be descriptive of the tables being related. For
example, `JurisdictionCountries` relates jurisdictions and countries.

Groups of tables which are part of the same subsystem should start with the same
prefix. For example, `ApprovalEvents` and `ApprovalEventHistory`. The best way
to name a table with a many-to-one relationship to another table is to just add
something to the name. For the above example, `ApprovalEventHistory` is a better
name than `ApprovalHistory`. You can't do this everywhere obviously or the names
would get very long, but, when appropriate, it is a very nice naming scheme.
Sometimes using a short acronym prefix works well, too. Stats tables should end
with Stats and start with the level of aggregation: Hourly, Daily, etc. If the
stats are not aggregated by time, then the aggregation modifier should be
omitted, e.g., PeriodStats and CriteriaStats.

#### Table aliases

Table aliasing is referring to the aliasing of table names within a query, using
`AS`. Note that use of `AS` is required.

Within an individual statement, table alias names can be initialisms or
abbreviations. For example, DPPS is much shorter than typing
`DailyPropertyPeriodStats` throughout a `SELECT` statement, and C can abbreviate
Campaigns. Handle abbreviation conflicts, e.g., C for both Campaigns and
Customers in a reasonable way; perhaps as CA and CU respectively.

Table alias conventions: `TableNameAlias`, `TABLE_NAME_ALIAS`, `TNA`.

`TABLE_NAME_ALIAS` or `TNA` is preferred over `TableNameAlias`, since it
provides better visual differentiation between table names and table aliases.

If you use upper case aliases in a query, then you should alias all tables, to
avoid mixing table name/alias styles when selecting columns.

~~~sql {.good}
/* Correct */

DEFINE TABLE MyBaz '/cns/...';

SELECT ...
FROM foo.bar.baz AS BAR_BAZ
LEFT JOIN MyBaz AS MB
  ON MB.key = BAR_BAZ.key;

-- It is OK to use an initialism to shorten long table names.
SELECT ...
FROM DailyPropertyPeriodStats AS DPPS;
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
  -- MyBaz should be aliased.
  MyBaz.user_id AS user_id,
  BAR_BAZ.customer_id AS customer_id
FROM foo.bar.baz BAR_BAZ  -- Missing AS keyword.
LEFT JOIN MyBaz
  ON MyBaz.key = BAR_BAZ.key;
~~~

#### Qualified names

When a statement contains more than one table, use partially qualified column
names including the tables or table aliases, e.g., `Campaigns.CampaignId`, not
just `CampaignId`. Although only one table in the statement may contain a
particular column name, qualifying immediately indicates the associated table,
helping the reader. Additionally, tables included in the query could add columns
later, so an unqualified column name which was unambiguous at the time the query
was written could become ambiguous later. Fully qualified names, which include
the database name, are rarely needed.

#### Keywords, custom functions and macros

**Terminology:** Keyword is a word with special meaning in a particular context,
for the specific SQL parser/engine (e.g. DremelSQL, GoogleSQL) being used. Some
standard SQL keywords include <code>SELECT, FROM, WHERE, IS NULL</code>. Some
non-standard SQL keywords, such as those in DremelSQL, include
<code>EXACT_COUNT_DISTINCT, GROUP_CONCAT, FORMAT_TIME_USEC</code>.

Keywords, as well as custom function and macro names should be written using
UPPERCASE letters. Most SQL parsers are not case-sensitive, but using all
uppercase letters makes it easier to see the structure of SQL code.

### Operator precedence

Don't rely on operator precedence in statements containing multiple different
operators of the same type (*e.g.*, arithmetic, comparison, or Boolean) in
sequence; doing so can make your code hard to read and can produce unintended
results.

When combining multiple operators in a single statement, use parentheses to make
the intended result clear, even when doing so does not change the result.

~~~sql {.good}
/* Correct */

WHERE
  (is_a_mammal AND is_found_in_north_america)
  OR (is_a_bird AND is_found_in_south_america)
~~~

~~~sql {.bad}
/* Incorrect */

WHERE
  is_a_mammal
  AND is_found_in_north_america
  OR is_a_bird
  AND is_found_in_south_america
~~~

~~~sql {.good}
/* Correct */

(num_1 + ((num_2 * num_3) / num_4)) - num_5
~~~

~~~sql {.bad}
/* Incorrect */

num_1 + num_2 * num_3 / num_4 - num_5
~~~

Parentheses are only required when using different operators of the same type in
sequence. Sequential uses of the same operator (*e.g.*, AND) do not require
parentheses.

~~~sql {.good}
WHERE
  cond_1
  AND cond_2
  AND cond_3
  AND cond_4
~~~

~~~sql {.good}
num_1 + num_2 + num_3 + num_4
~~~

~~~sql {.good}
WHERE
  body_temperature_celsius IS NOT NULL
  AND (body_temperature_celsius * 1.8) + 32 <= 98.6
  AND NOT patient_is_dead
~~~

## Language features

### Joins and unions

Explicitly indicate the type of table join, especially if not the default
<code>INNER JOIN</code>, such as <code>CROSS JOIN</code>, <code>LEFT
JOIN</code>, <code>RIGHT JOIN</code>, or <code>NATURAL LEFT JOIN</code>, etc.

The use of <code>ON</code> or <code>USING</code> to indicate how tables should
be joined is required where applicable. Using this syntax permits any subsequent
<code>WHERE</code> clause to contain only semantically important information,
not just table joining expressions. When using <code>ON</code> or
<code>USING</code>, add a space before the parenthetical expression (if
parenthesis are required).

For queries with joins or unions, column name references should always include
source table reference.

~~~sql {.good}
/* Correct */

SELECT
  -- Use table aliases, even if column names are unique.
  TABLE_A.column_one,
  TABLE_B.column_three
FROM
  (
    SELECT
      column_one,
      column_two
    FROM D
  ) AS TABLE_A
-- Explicit join type.
INNER JOIN
  -- Since one table is aliased, alias other tables, to ensure table references
  -- have consistent style in SELECT.
  TableB AS TABLE_B
  ON TABLE_A.column_one = TABLE_B.column_one;
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
  TABLE_A.column_one,
  column_three,  -- Missing table reference.
  TableB.column_four
FROM
  (
    SELECT
      column_one,
      column_two
    FROM D
  ) AS TABLE_A
-- Implicit join type.
JOIN
  TableB  -- No table alias, resulting in mixed table reference styles.
  ON TABLE_A.column_one = TableB.column_one;
~~~

### Table aliases

Table aliases should be specified including the `AS` keyword to avoid visual
confusion when it is omitted. For example, `Campaigns C` can be confused with
`Campaigns, C` since `AS` is not present.

### Prefer more specific syntax

When there are multiple ways to write the same code, prefer the syntax that
reveals the structure the most except if it degrades performance. For example,
it is preferred to use <code>JOIN</code>s in the <code>FROM</code> clause so the
<code>WHERE</code> clause can contain only expressions not involved with table
joining. Using <code>BETWEEN</code> is preferred over using <code>AND</code>
with comparisons. Using <code>IN</code> is preferred over using multiple
<code>OR</code>s. Using <code>CASE</code> is preferred over using multiple
<code>IF</code>s.

### Single quotes

Use single quotes, e.g., 'hello world', around strings, not double quotes ("),
because the ANSI SQL standard only specifies the former. However, remember to be
and remain consistent if you have chosen to use double quotes.

### GROUP|ORDER BY clause

Organize the columns in the <code>SELECT</code> clause so that all columns that
serve as grouping columns are selected first, followed by aggregated columns.
For example:

~~~sql {.good}
/* Correct */

SELECT
  service_country_code,
  sector_name,
  SUM(revenue) AS revenue
~~~

~~~sql {.bad}
/* Incorrect */

SELECT
  sector_name,
  -- Aggregations should be below grouped columns.
  SUM(revenue) AS revenue,
  service_country_code
~~~

In a <code>GROUP BY</code> clause, only consecutive indices are allowed,
otherwise use column names. Note, however, that this is only relevant for legacy
code, since given the "grouping columns are selected first" constraint above,
grouped columns will always be consecutive in new code.

In an <code>ORDER BY</code> clause, column names are always required.

As with a <code>SELECT</code> clause, limit one column name per line unless all
column names will fit on a single line.

~~~sql {.good}
/* Correct */

-- When grouping by non-consecutive columns (legacy code),
-- column names are required.
GROUP BY col_1, col_2, col_9, col_21, col_5, col_6

-- In new and fully style compliant code, you will always be grouping by
-- consecutive columns, so both indices and column names are allowed.
GROUP BY col_1, col_2, col_3, col_4, col_5, col_6;
GROUP BY 1, 2, 3, 4, 5, 6;
~~~

~~~sql {.bad}
/* Incorrect */

-- Do not use indices for non-consecutive columns.
GROUP BY 1, 2, 9, 21, 5, 6

-- Do not mix column names and indices in the same GROUP BY or ORDER BY.
GROUP BY col_1, col_2, col_3, col_4, 5, 6;
~~~

### Macros

Generally, treat macros as either constants (if they are not parameterized) or
functions. When treating macro as a function, same indentation rules apply.

General guidelines for using macros:

*   Consider both complexity and clarity when adding macros. If the code is much
    more difficult to understand with macros, you've probably gone too far.
*   Do not hard code table aliases in macros. This couples macro and query
    implementation, making development and maintenance more complicated.
*   For macros that contain a full SELECT statement, include the outer braces,
    so that you don't have to add them when using the macro.
*   Avoid using macros instead of WITH (GoogleSQL) or temporary/inline tables.
*   If you have a SELECT macro that is shared by multiple scripts, consider
    using a permanent table instead, it may provide a significant improvement in
    performance and resource utilization.

~~~sql {.good}
DEFINE MACRO SOME_MACRO
  ...
  ...;
~~~

## Policies

### Issues unspecified by Google Style: Be Consistent!

For any style question that isn't settled definitively by this specification,
prefer to do what the other code in the same file is already doing. If that
doesn't resolve the question, consider emulating the other files in the same
package.

### Code not in Google style

You will occasionally encounter files in your codebase that are not in proper
Google Style. These may have come from an acquisition, or may have been written
before Google Style took a position on some issue, or may be in non-Google Style
for any other reason.

#### Reformatting existing code {#reformatting-existing-code}

When updating the style of existing code, follow these guidelines.

1.  It is not required to change all existing code to meet current style
    guidelines. Reformatting existing code is a trade-off between code churn and
    consistency. Style rules evolve over time and these kinds of tweaks to
    maintain compliance would create unnecessary churn. However, if significant
    changes are being made to a file it is expected that the file will be in
    Google Style.
2.  Be careful not to allow opportunistic style fixes to muddle the focus of a
    CL. If you find yourself making a lot of style changes that aren’t critical
    to the central focus of a CL, promote those changes to a separate CL.

#### Newly added code: use Google style

Brand new files use Google Style, regardless of the style choices of other files
in the same package.

When adding new code to a file that is not in Google Style, reformatting the
existing code first is recommended, subject to the advice in [Reformatting
existing code.](#reformatting-existing-code)

If this reformatting is not done, then new code should be as consistent as
possible with existing code in the same file, but must not violate the style
guide.

### Local style rules

Teams and projects may adopt additional style rules beyond those in this
document, but must accept that cleanup changes may not abide by these additional
rules, and must not block such cleanup changes due to violating any additional
rules. Beware of excessive rules which serve no purpose. The style guide does
not seek to define style in every possible scenario and neither should you.

### Embedded SQL: exempt

SQL scripts or statements embedded into other programming language files that
serve the purpose of automation, testing, debugging are exempt.
