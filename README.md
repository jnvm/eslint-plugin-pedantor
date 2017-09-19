# eslint-plugin-pedantor

Enforce part of speech and regex naming conventions, currently only on functions.

Ever wanted to insist function names:
* start with a verb?
* follow some other part of speech / string pattern?
* do not contain certain parts of speech / string patterns?

Then this is for you.

## Installation

You'll first need to install [ESLint](http://eslint.org):

```
$ npm i eslint --save-dev
```

Next, install `eslint-plugin-pedantor`:

```
$ npm install eslint-plugin-pedantor --save-dev
```

**Note:** If you installed ESLint globally (using the `-g` flag) then you must also install `eslint-plugin-pedantor` globally.

## Usage

Add `pedantor` to the plugins section of your `.eslintrc` configuration file. You can omit the `eslint-plugin-` prefix:

```json
{
    "plugins": [
        "pedantor"
    ]
}
```


Then configure the rule.  Currently only `fxn-name-convention` is supported, detailed below.

```javascript
{
	"rules": {
		"pedantor/fxn-name-convention": [1, {
			allow: ['^#Verb' /*,...*/ ]
			,disallow: [/mapper|reducer|controller/i /*,...*/ ]
			,assume: new Map([
				[/tweet/i, 'Verb']
				//,...
			])
		}]
	}
}

```
Each value in `allow`, `disallow` can be:
* a [match syntax](https://github.com/nlp-compromise/compromise/wiki/Match-syntax) string used by the natural language processing [`compromise`](http://compromise.cool/) module
* or a plain [`/regex/`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

**Note**: matching is attempted against the [`_.lowerCase()d`](https://lodash.com/docs/#lowerCase) version of the function name.  So `doThing()` becomes `do thing`.

Given the nlp module is not perfect, or you might want to add your own conventions, you can assign a `new Map()` to `assume` and point some strings or regex to parts of speech.  For example: maybe `XHR` should be a `Verb`.