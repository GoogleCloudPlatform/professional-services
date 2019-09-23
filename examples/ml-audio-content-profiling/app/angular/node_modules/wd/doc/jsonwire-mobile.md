### Mobile JsonWire Protocol Methods ###

Wd.js is incrementally implementing the Mobile JsonWire Protocol Spec
 - read the [draft](https://code.google.com/p/selenium/source/browse/spec-draft.md?repo=mobile)
 - Look for `mjsonWire` in the [api doc](https://github.com/admc/wd/blob/master/doc/api.md).

#### -ios uiautomation Locator Strategy ####

Find elements in iOS applications using the [UIAutomation Javascript API](https://developer.apple.com/library/ios/documentation/DeveloperTools/Reference/UIAutomationRef/_index.html)

eg:
```
wd.elementsByIosUIAutomation('.tableViews()[0].cells()', function(err, el){
  el.elementByIosUIAutomation('.elements()["UICatalog"]', function(err, el){
    el.getAttribute('name', function(err, name){
      console.log(name);
    });
  });
});
```

#### -ios class chain Locator Strategy ####

Find elements in iOS applications using the [WebDriverAgent Class Chain API](https://github.com/facebook/WebDriverAgent/wiki/Class-Chain-Queries-Construction-Rules)

eg:
```
wd.elementsByIosClassChain('XCUIElementTypeWindow/XCUIElementTypeAny[`value == "bla1" OR label == "bla2"`]', function(err, el){
  el.getAttribute('name', function(err, name){
    console.log(name);
  });
});
```

#### -ios predicate Locator Strategy ####

Find elements in iOS applications using the [WebDriverAgent Predicate API](https://github.com/facebook/WebDriverAgent/wiki/Predicate-Queries-Construction-Rules)

eg:
```
wd.elementsByIosPredicateString('type IN {`XCUIElementTypeIcon`,`XCUIElementTypeImage`} AND visible == 1', function(err, el){
  el.getAttribute('name', function(err, name){
    console.log(name);
  });
});
```

#### -android uiautomator Locator Strategy ####

Find elements in android applications using the [UiSelector Class](http://developer.android.com/tools/help/uiautomator/UiSelector.html)

eg:
```
wd.elementsByAndroidUIAutomator('new UiSelector().clickable(true)', function(err, els){
  console.log("number of clickable elements:", els.length);
});
```

#### -android datamatcher Locator Strategy ####

Find elements in android applications using Espresso [Data Matcher](https://developer.android.com/reference/android/support/test/espresso/DataInteraction)

e.g.:
```
wd.elementsByAndroidDataMatcher(JSON.stringify({name: "hasEntry", args: ["title", "ViewTitle"]})', function(err, els){
  console.log("number of clickable elements:", els.length);
});
```

#### accessibility id ####

Find elements by whatever identifier is used by the platforms Accessibility framework.

eg:
```
wd.elementByAccessibilityId("Submit", function(err, el){
  el.click();
});
