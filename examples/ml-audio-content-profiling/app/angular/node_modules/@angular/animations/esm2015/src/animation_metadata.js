/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * Represents a set of CSS styles for use in an animation style.
 * @record
 */
export function ɵStyleData() { }
/** @enum {number} */
var AnimationMetadataType = {
    /**
       * Associates a named animation state with a set of CSS styles.
       * See `state()`
       */
    State: 0,
    /**
       * Data for a transition from one animation state to another.
       * See `transition()`
       */
    Transition: 1,
    /**
       * Contains a set of animation steps.
       * See `sequence()`
       */
    Sequence: 2,
    /**
       * Contains a set of animation steps.
       * See `{@link animations/group group()}`
       */
    Group: 3,
    /**
       * Contains an animation step.
       * See `animate()`
       */
    Animate: 4,
    /**
       * Contains a set of animation steps.
       * See `keyframes()`
       */
    Keyframes: 5,
    /**
       * Contains a set of CSS property-value pairs into a named style.
       * See `style()`
       */
    Style: 6,
    /**
       * Associates an animation with an entry trigger that can be attached to an element.
       * See `trigger()`
       */
    Trigger: 7,
    /**
       * Contains a re-usable animation.
       * See `animation()`
       */
    Reference: 8,
    /**
       * Contains data to use in executing child animations returned by a query.
       * See `animateChild()`
       */
    AnimateChild: 9,
    /**
       * Contains animation parameters for a re-usable animation.
       * See `useAnimation()`
       */
    AnimateRef: 10,
    /**
       * Contains child-animation query data.
       * See `query()`
       */
    Query: 11,
    /**
       * Contains data for staggering an animation sequence.
       * See `stagger()`
       */
    Stagger: 12,
};
export { AnimationMetadataType };
/** *
 * Specifies automatic styling.
 *
 * \@publicApi
  @type {?} */
export const AUTO_STYLE = '*';
/**
 * Base for animation data structures.
 *
 * \@publicApi
 * @record
 */
export function AnimationMetadata() { }
/** @type {?} */
AnimationMetadata.prototype.type;
/**
 * Contains an animation trigger. Instantiated and returned by the
 * `trigger()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationTriggerMetadata() { }
/**
 * The trigger name, used to associate it with an element. Unique within the component.
 * @type {?}
 */
AnimationTriggerMetadata.prototype.name;
/**
 * An animation definition object, containing an array of state and transition declarations.
 * @type {?}
 */
AnimationTriggerMetadata.prototype.definitions;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationTriggerMetadata.prototype.options;
/**
 * Encapsulates an animation state by associating a state name with a set of CSS styles.
 * Instantiated and returned by the `state()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationStateMetadata() { }
/**
 * The state name, unique within the component.
 * @type {?}
 */
AnimationStateMetadata.prototype.name;
/**
 *  The CSS styles associated with this state.
 * @type {?}
 */
AnimationStateMetadata.prototype.styles;
/**
 * An options object containing
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation.
 * @type {?|undefined}
 */
AnimationStateMetadata.prototype.options;
/**
 * Encapsulates an animation transition. Instantiated and returned by the
 * `transition()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationTransitionMetadata() { }
/**
 * An expression that describes a state change.
 * @type {?}
 */
AnimationTransitionMetadata.prototype.expr;
/**
 * One or more animation objects to which this transition applies.
 * @type {?}
 */
AnimationTransitionMetadata.prototype.animation;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationTransitionMetadata.prototype.options;
/**
 * Encapsulates a reusable animation, which is a collection of individual animation steps.
 * Instantiated and returned by the `animation()` function, and
 * passed to the `useAnimation()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationReferenceMetadata() { }
/**
 *  One or more animation step objects.
 * @type {?}
 */
AnimationReferenceMetadata.prototype.animation;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationReferenceMetadata.prototype.options;
/**
 * Encapsulates an animation query. Instantiated and returned by
 * the `query()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationQueryMetadata() { }
/**
 *  The CSS selector for this query.
 * @type {?}
 */
AnimationQueryMetadata.prototype.selector;
/**
 * One or more animation step objects.
 * @type {?}
 */
AnimationQueryMetadata.prototype.animation;
/**
 * A query options object.
 * @type {?}
 */
AnimationQueryMetadata.prototype.options;
/**
 * Encapsulates a keyframes sequence. Instantiated and returned by
 * the `keyframes()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationKeyframesSequenceMetadata() { }
/**
 * An array of animation styles.
 * @type {?}
 */
AnimationKeyframesSequenceMetadata.prototype.steps;
/**
 * Encapsulates an animation style. Instantiated and returned by
 * the `style()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationStyleMetadata() { }
/**
 * A set of CSS style properties.
 * @type {?}
 */
AnimationStyleMetadata.prototype.styles;
/**
 * A percentage of the total animate time at which the style is to be applied.
 * @type {?}
 */
AnimationStyleMetadata.prototype.offset;
/**
 * Encapsulates an animation step. Instantiated and returned by
 * the `animate()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationAnimateMetadata() { }
/**
 * The timing data for the step.
 * @type {?}
 */
AnimationAnimateMetadata.prototype.timings;
/**
 * A set of styles used in the step.
 * @type {?}
 */
AnimationAnimateMetadata.prototype.styles;
/**
 * Encapsulates a child animation, that can be run explicitly when the parent is run.
 * Instantiated and returned by the `animateChild` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationAnimateChildMetadata() { }
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationAnimateChildMetadata.prototype.options;
/**
 * Encapsulates a reusable animation.
 * Instantiated and returned by the `useAnimation()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationAnimateRefMetadata() { }
/**
 * An animation reference object.
 * @type {?}
 */
AnimationAnimateRefMetadata.prototype.animation;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationAnimateRefMetadata.prototype.options;
/**
 * Encapsulates an animation sequence.
 * Instantiated and returned by the `sequence()` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationSequenceMetadata() { }
/**
 *  An array of animation step objects.
 * @type {?}
 */
AnimationSequenceMetadata.prototype.steps;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationSequenceMetadata.prototype.options;
/**
 * Encapsulates an animation group.
 * Instantiated and returned by the `{\@link animations/group group()}` function.
 *
 * \@publicApi
 * @record
 */
export function AnimationGroupMetadata() { }
/**
 * One or more animation or style steps that form this group.
 * @type {?}
 */
AnimationGroupMetadata.prototype.steps;
/**
 * An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation. Default delay is 0.
 * @type {?}
 */
AnimationGroupMetadata.prototype.options;
/**
 * Encapsulates parameters for staggering the start times of a set of animation steps.
 * Instantiated and returned by the `stagger()` function.
 *
 * \@publicApi
 *
 * @record
 */
export function AnimationStaggerMetadata() { }
/**
 * The timing data for the steps.
 * @type {?}
 */
AnimationStaggerMetadata.prototype.timings;
/**
 * One or more animation steps.
 * @type {?}
 */
AnimationStaggerMetadata.prototype.animation;
/**
 * Creates a named animation trigger, containing a  list of `state()`
 * and `transition()` entries to be evaluated when the expression
 * bound to the trigger changes.
 *
 * \@usageNotes
 * Define an animation trigger in the `animations` section of `\@Component` metadata.
 * In the template, reference the trigger by name and bind it to a trigger expression that
 * evaluates to a defined animation state, using the following format:
 *
 * `[\@triggerName]="expression"`
 *
 * Animation trigger bindings convert all values to strings, and then match the
 * previous and current values against any linked transitions.
 * Booleans can be specified as `1` or `true` and `0` or `false`.
 *
 * ### Usage Example
 *
 * The following example creates an animation trigger reference based on the provided
 * name value.
 * The provided animation value is expected to be an array consisting of state and
 * transition declarations.
 *
 * ```typescript
 * \@Component({
 *   selector: "my-component",
 *   templateUrl: "my-component-tpl.html",
 *   animations: [
 *     trigger("myAnimationTrigger", [
 *       state(...),
 *       state(...),
 *       transition(...),
 *       transition(...)
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   myStatusExp = "something";
 * }
 * ```
 *
 * The template associated with this component makes use of the defined trigger
 * by binding to an element within its template code.
 *
 * ```html
 * <!-- somewhere inside of my-component-tpl.html -->
 * <div [\@myAnimationTrigger]="myStatusExp">...</div>
 * ```
 *
 * ### Using an inline function
 * The `transition` animation method also supports reading an inline function which can decide
 * if its associated animation should be run.
 *
 * ```typescript
 * // this method is run each time the `myAnimationTrigger` trigger value changes.
 * function myInlineMatcherFn(fromState: string, toState: string, element: any, params: {[key:
 * string]: any}): boolean {
 *   // notice that `element` and `params` are also available here
 *   return toState == 'yes-please-animate';
 * }
 *
 * \@Component({
 *   selector: 'my-component',
 *   templateUrl: 'my-component-tpl.html',
 *   animations: [
 *     trigger('myAnimationTrigger', [
 *       transition(myInlineMatcherFn, [
 *         // the animation sequence code
 *       ]),
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   myStatusExp = "yes-please-animate";
 * }
 * ```
 *
 * ### Disabling Animations
 * When true, the special animation control binding `\@.disabled` binding prevents
 * all animations from rendering.
 * Place the  `\@.disabled` binding on an element to disable
 * animations on the element itself, as well as any inner animation triggers
 * within the element.
 *
 * The following example shows how to use this feature:
 *
 * ```typescript
 * \@Component({
 *   selector: 'my-component',
 *   template: `
 *     <div [\@.disabled]="isDisabled">
 *       <div [\@childAnimation]="exp"></div>
 *     </div>
 *   `,
 *   animations: [
 *     trigger("childAnimation", [
 *       // ...
 *     ])
 *   ]
 * })
 * class MyComponent {
 *   isDisabled = true;
 *   exp = '...';
 * }
 * ```
 *
 * When `\@.disabled` is true, it prevents the `\@childAnimation` trigger from animating,
 * along with any inner animations.
 *
 * ### Disable animations application-wide
 * When an area of the template is set to have animations disabled,
 * **all** inner components have their animations disabled as well.
 * This means that you can disable all animations for an app
 * by placing a host binding set on `\@.disabled` on the topmost Angular component.
 *
 * ```typescript
 * import {Component, HostBinding} from '\@angular/core';
 *
 * \@Component({
 *   selector: 'app-component',
 *   templateUrl: 'app.component.html',
 * })
 * class AppComponent {
 * \@HostBinding('@.disabled')
 *   public animationsDisabled = true;
 * }
 * ```
 *
 * ### Overriding disablement of inner animations
 * Despite inner animations being disabled, a parent animation can `query()`
 * for inner elements located in disabled areas of the template and still animate
 * them if needed. This is also the case for when a sub animation is
 * queried by a parent and then later animated using `animateChild()`.
 *
 * ### Detecting when an animation is disabled
 * If a region of the DOM (or the entire application) has its animations disabled, the animation
 * trigger callbacks still fire, but for zero seconds. When the callback fires, it provides
 * an instance of an `AnimationEvent`. If animations are disabled,
 * the `.disabled` flag on the event is true.
 *
 * \@publicApi
 * @param {?} name An identifying string.
 * @param {?} definitions  An animation definition object, containing an array of `state()`
 * and `transition()` declarations.
 *
 * @return {?} An object that encapsulates the trigger data.
 *
 */
export function trigger(name, definitions) {
    return { type: 7 /* Trigger */, name, definitions, options: {} };
}
/**
 * Defines an animation step that combines styling information with timing information.
 *
 * \@usageNotes
 * Call within an animation `sequence()`, `{\@link animations/group group()}`, or
 * `transition()` call to specify an animation step
 * that applies given style data to the parent animation for a given amount of time.
 *
 * ### Syntax Examples
 * **Timing examples**
 *
 * The following examples show various `timings` specifications.
 * - `animate(500)` : Duration is 500 milliseconds.
 * - `animate("1s")` : Duration is 1000 milliseconds.
 * - `animate("100ms 0.5s")` : Duration is 100 milliseconds, delay is 500 milliseconds.
 * - `animate("5s ease-in")` : Duration is 5000 milliseconds, easing in.
 * - `animate("5s 10ms cubic-bezier(.17,.67,.88,.1)")` : Duration is 5000 milliseconds, delay is 10
 * milliseconds, easing according to a bezier curve.
 *
 * **Style examples**
 *
 * The following example calls `style()` to set a single CSS style.
 * ```typescript
 * animate(500, style({ background: "red" }))
 * ```
 * The following example calls `keyframes()` to set a CSS style
 * to different values for successive keyframes.
 * ```typescript
 * animate(500, keyframes(
 *  [
 *   style({ background: "blue" })),
 *   style({ background: "red" }))
 *  ])
 * ```
 *
 * \@publicApi
 * @param {?} timings Sets `AnimateTimings` for the parent animation.
 * A string in the format "duration [delay] [easing]".
 *  - Duration and delay are expressed as a number and optional time unit,
 * such as "1s" or "10ms" for one second and 10 milliseconds, respectively.
 * The default unit is milliseconds.
 *  - The easing value controls how the animation accelerates and decelerates
 * during its runtime. Value is one of  `ease`, `ease-in`, `ease-out`,
 * `ease-in-out`, or a `cubic-bezier()` function call.
 * If not supplied, no easing is applied.
 *
 * For example, the string "1s 100ms ease-out" specifies a duration of
 * 1000 milliseconds, and delay of 100 ms, and the "ease-out" easing style,
 * which decelerates near the end of the duration.
 * @param {?=} styles Sets AnimationStyles for the parent animation.
 * A function call to either `style()` or `keyframes()`
 * that returns a collection of CSS style entries to be applied to the parent animation.
 * When null, uses the styles from the destination state.
 * This is useful when describing an animation step that will complete an animation;
 * see "Animating to the final state" in `transitions()`.
 * @return {?} An object that encapsulates the animation step.
 *
 */
export function animate(timings, styles = null) {
    return { type: 4 /* Animate */, styles, timings };
}
/**
 * \@description Defines a list of animation steps to be run in parallel.
 *
 * \@usageNotes
 * Grouped animations are useful when a series of styles must be
 * animated at different starting times and closed off at different ending times.
 *
 * When called within a `sequence()` or a
 * `transition()` call, does not continue to the next
 * instruction until all of the inner animation steps have completed.
 *
 * \@publicApi
 * @param {?} steps An array of animation step objects.
 * - When steps are defined by `style()` or `animate()`
 * function calls, each call within the group is executed instantly.
 * - To specify offset styles to be applied at a later time, define steps with
 * `keyframes()`, or use `animate()` calls with a delay value.
 * For example:
 *
 * ```typescript
 * group([
 *   animate("1s", { background: "black" }))
 *   animate("2s", { color: "white" }))
 * ])
 * ```
 *
 * @param {?=} options An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation.
 *
 * @return {?} An object that encapsulates the group data.
 *
 */
export function group(steps, options = null) {
    return { type: 3 /* Group */, steps, options };
}
/**
 * Defines a list of animation steps to be run sequentially, one by one.
 *
 * \@usageNotes
 * When you pass an array of steps to a
 * `transition()` call, the steps run sequentially by default.
 * Compare this to the `{\@link animations/group group()}` call, which runs animation steps in parallel.
 *
 * When a sequence is used within a `{\@link animations/group group()}` or a `transition()` call,
 * execution continues to the next instruction only after each of the inner animation
 * steps have completed.
 *
 * \@publicApi
 *
 * @param {?} steps An array of animation step objects.
 * - Steps defined by `style()` calls apply the styling data immediately.
 * - Steps defined by `animate()` calls apply the styling data over time
 *   as specified by the timing data.
 *
 * ```typescript
 * sequence([
 *   style({ opacity: 0 })),
 *   animate("1s", { opacity: 1 }))
 * ])
 * ```
 *
 * @param {?=} options An options object containing a delay and
 * developer-defined parameters that provide styling defaults and
 * can be overridden on invocation.
 *
 * @return {?} An object that encapsulates the sequence data.
 *
 */
export function sequence(steps, options = null) {
    return { type: 2 /* Sequence */, steps, options };
}
/**
 * Declares a key/value object containing CSS properties/styles that
 * can then be used for an animation `state`, within an animation `sequence`,
 * or as styling data for calls to `animate()` and `keyframes()`.
 *
 * \@usageNotes
 * The following examples create animation styles that collect a set of
 * CSS property values:
 *
 * ```typescript
 * // string values for CSS properties
 * style({ background: "red", color: "blue" })
 *
 * // numerical pixel values
 * style({ width: 100, height: 0 })
 * ```
 *
 * The following example uses auto-styling to allow a component to animate from
 * a height of 0 up to the height of the parent element:
 *
 * ```
 * style({ height: 0 }),
 * animate("1s", style({ height: "*" }))
 * ```
 *
 * \@publicApi
 *
 * @param {?} tokens A set of CSS styles or HTML styles associated with an animation state.
 * The value can be any of the following:
 * - A key-value style pair associating a CSS property with a value.
 * - An array of key-value style pairs.
 * - An asterisk (*), to use auto-styling, where styles are derived from the element
 * being animated and applied to the animation when it starts.
 *
 * Auto-styling can be used to define a state that depends on layout or other
 * environmental factors.
 *
 * @return {?} An object that encapsulates the style data.
 *
 */
export function style(tokens) {
    return { type: 6 /* Style */, styles: tokens, offset: null };
}
/**
 * Declares an animation state within a trigger attached to an element.
 *
 * \@usageNotes
 * Use the `trigger()` function to register states to an animation trigger.
 * Use the `transition()` function to animate between states.
 * When a state is active within a component, its associated styles persist on the element,
 * even when the animation ends.
 *
 * \@publicApi
 *
 * @param {?} name One or more names for the defined state in a comma-separated string.
 * The following reserved state names can be supplied to define a style for specific use
 * cases:
 *
 * - `void` You can associate styles with this name to be used when
 * the element is detached from the application. For example, when an `ngIf` evaluates
 * to false, the state of the associated element is void.
 *  - `*` (asterisk) Indicates the default state. You can associate styles with this name
 * to be used as the fallback when the state that is being animated is not declared
 * within the trigger.
 *
 * @param {?} styles A set of CSS styles associated with this state, created using the
 * `style()` function.
 * This set of styles persists on the element once the state has been reached.
 * @param {?=} options Parameters that can be passed to the state when it is invoked.
 * 0 or more key-value pairs.
 * @return {?} An object that encapsulates the new state data.
 *
 */
export function state(name, styles, options) {
    return { type: 0 /* State */, name, styles, options };
}
/**
 * Defines a set of animation styles, associating each style with an optional `offset` value.
 *
 * \@usageNotes
 * Use with the `animate()` call. Instead of applying animations
 * from the current state
 * to the destination state, keyframes describe how each style entry is applied and at what point
 * within the animation arc.
 * Compare [CSS Keyframe Animations](https://www.w3schools.com/css/css3_animations.asp).
 *
 * ### Usage
 *
 * In the following example, the offset values describe
 * when each `backgroundColor` value is applied. The color is red at the start, and changes to
 * blue when 20% of the total time has elapsed.
 *
 * ```typescript
 * // the provided offset values
 * animate("5s", keyframes([
 *   style({ backgroundColor: "red", offset: 0 }),
 *   style({ backgroundColor: "blue", offset: 0.2 }),
 *   style({ backgroundColor: "orange", offset: 0.3 }),
 *   style({ backgroundColor: "black", offset: 1 })
 * ]))
 * ```
 *
 * If there are no `offset` values specified in the style entries, the offsets
 * are calculated automatically.
 *
 * ```typescript
 * animate("5s", keyframes([
 *   style({ backgroundColor: "red" }) // offset = 0
 *   style({ backgroundColor: "blue" }) // offset = 0.33
 *   style({ backgroundColor: "orange" }) // offset = 0.66
 *   style({ backgroundColor: "black" }) // offset = 1
 * ]))
 * ```
 * \@publicApi
 * @param {?} steps A set of animation styles with optional offset data.
 * The optional `offset` value for a style specifies a percentage of the total animation
 * time at which that style is applied.
 * @return {?} An object that encapsulates the keyframes data.
 *
 */
export function keyframes(steps) {
    return { type: 5 /* Keyframes */, steps };
}
/**
 * Declares an animation transition as a sequence of animation steps to run when a given
 * condition is satisfied. The condition is a Boolean expression or function that compares
 * the previous and current animation states, and returns true if this transition should occur.
 * When the state criteria of a defined transition are met, the associated animation is
 * triggered.
 *
 * \@usageNotes
 * The template associated with a component binds an animation trigger to an element.
 *
 * ```HTML
 * <!-- somewhere inside of my-component-tpl.html -->
 * <div [\@myAnimationTrigger]="myStatusExp">...</div>
 * ```
 *
 * All transitions are defined within an animation trigger,
 * along with named states that the transitions change to and from.
 *
 * ```typescript
 * trigger("myAnimationTrigger", [
 *  // define states
 *  state("on", style({ background: "green" })),
 *  state("off", style({ background: "grey" })),
 *  ...]
 * ```
 *
 * Note that when you call the `sequence()` function within a `{\@link animations/group group()}`
 * or a `transition()` call, execution does not continue to the next instruction
 * until each of the inner animation steps have completed.
 *
 * ### Syntax examples
 *
 * The following examples define transitions between the two defined states (and default states),
 * using various options:
 *
 * ```typescript
 * // Transition occurs when the state value
 * // bound to "myAnimationTrigger" changes from "on" to "off"
 * transition("on => off", animate(500))
 * // Run the same animation for both directions
 * transition("on <=> off", animate(500))
 * // Define multiple state-change pairs separated by commas
 * transition("on => off, off => void", animate(500))
 * ```
 *
 * ### Special values for state-change expressions
 *
 * - Catch-all state change for when an element is inserted into the page and the
 * destination state is unknown:
 *
 * ```typescript
 * transition("void => *", [
 *  style({ opacity: 0 }),
 *  animate(500)
 *  ])
 * ```
 *
 * - Capture a state change between any states:
 *
 *  `transition("* => *", animate("1s 0s"))`
 *
 * - Entry and exit transitions:
 *
 * ```typescript
 * transition(":enter", [
 *   style({ opacity: 0 }),
 *   animate(500, style({ opacity: 1 }))
 *   ]),
 * transition(":leave", [
 *   animate(500, style({ opacity: 0 }))
 *   ])
 * ```
 *
 * - Use `:increment` and `:decrement` to initiate transitions:
 *
 * ```typescript
 * transition(":increment", group([
 *  query(':enter', [
 *     style({ left: '100%' }),
 *     animate('0.5s ease-out', style('*'))
 *   ]),
 *  query(':leave', [
 *     animate('0.5s ease-out', style({ left: '-100%' }))
 *  ])
 * ]))
 *
 * transition(":decrement", group([
 *  query(':enter', [
 *     style({ left: '100%' }),
 *     animate('0.5s ease-out', style('*'))
 *   ]),
 *  query(':leave', [
 *     animate('0.5s ease-out', style({ left: '-100%' }))
 *  ])
 * ]))
 * ```
 *
 * ### State-change functions
 *
 * Here is an example of a `fromState` specified as a state-change function that invokes an
 * animation when true:
 *
 * ```typescript
 * transition((fromState, toState) =>
 *  {
 *   return fromState == "off" && toState == "on";
 *  },
 *  animate("1s 0s"))
 * ```
 *
 * ### Animating to the final state
 *
 * If the final step in a transition is a call to `animate()` that uses a timing value
 * with no style data, that step is automatically considered the final animation arc,
 * for the element to reach the final state. Angular automatically adds or removes
 * CSS styles to ensure that the element is in the correct final state.
 *
 * The following example defines a transition that starts by hiding the element,
 * then makes sure that it animates properly to whatever state is currently active for trigger:
 *
 * ```typescript
 * transition("void => *", [
 *   style({ opacity: 0 }),
 *   animate(500)
 *  ])
 * ```
 * ### Boolean value matching
 * If a trigger binding value is a Boolean, it can be matched using a transition expression
 * that compares true and false or 1 and 0. For example:
 *
 * ```
 * // in the template
 * <div [\@openClose]="open ? true : false">...</div>
 * // in the component metadata
 * trigger('openClose', [
 *   state('true', style({ height: '*' })),
 *   state('false', style({ height: '0px' })),
 *   transition('false <=> true', animate(500))
 * ])
 * ```
 *
 * \@publicApi
 *
 * @param {?} stateChangeExpr A Boolean expression or function that compares the previous and current
 * animation states, and returns true if this transition should occur. Note that  "true" and "false"
 * match 1 and 0, respectively. An expression is evaluated each time a state change occurs in the
 * animation trigger element.
 * The animation steps run when the expression evaluates to true.
 *
 * - A state-change string takes the form "state1 => state2", where each side is a defined animation
 * state, or an asterix (*) to refer to a dynamic start or end state.
 *   - The expression string can contain multiple comma-separated statements;
 * for example "state1 => state2, state3 => state4".
 *   - Special values `:enter` and `:leave` initiate a transition on the entry and exit states,
 * equivalent to  "void => *"  and "* => void".
 *   - Special values `:increment` and `:decrement` initiate a transition when a numeric value has
 * increased or decreased in value.
 * - A function is executed each time a state change occurs in the animation trigger element.
 * The animation steps run when the function returns true.
 *
 * @param {?} steps One or more animation objects, as returned by the `animate()` or
 * `sequence()` function, that form a transformation from one state to another.
 * A sequence is used by default when you pass an array.
 * @param {?=} options An options object that can contain a delay value for the start of the animation,
 * and additional developer-defined parameters. Provided values for additional parameters are used
 * as defaults, and override values can be passed to the caller on invocation.
 * @return {?} An object that encapsulates the transition data.
 *
 */
export function transition(stateChangeExpr, steps, options = null) {
    return { type: 1 /* Transition */, expr: stateChangeExpr, animation: steps, options };
}
/**
 * Produces a reusable animation that can be invoked in another animation or sequence,
 * by calling the `useAnimation()` function.
 *
 * \@usageNotes
 * The following example defines a reusable animation, providing some default parameter
 * values.
 *
 * ```typescript
 * var fadeAnimation = animation([
 *   style({ opacity: '{{ start }}' }),
 *   animate('{{ time }}',
 *   style({ opacity: '{{ end }}'}))
 *   ],
 *   { params: { time: '1000ms', start: 0, end: 1 }});
 * ```
 *
 * The following invokes the defined animation with a call to `useAnimation()`,
 * passing in override parameter values.
 *
 * ```js
 * useAnimation(fadeAnimation, {
 *   params: {
 *     time: '2s',
 *     start: 1,
 *     end: 0
 *   }
 * })
 * ```
 *
 * If any of the passed-in parameter values are missing from this call,
 * the default values are used. If one or more parameter values are missing before a step is
 * animated, `useAnimation()` throws an error.
 *
 * \@publicApi
 * @param {?} steps One or more animation objects, as returned by the `animate()`
 * or `sequence()` function, that form a transformation from one state to another.
 * A sequence is used by default when you pass an array.
 * @param {?=} options An options object that can contain a delay value for the start of the
 * animation, and additional developer-defined parameters.
 * Provided values for additional parameters are used as defaults,
 * and override values can be passed to the caller on invocation.
 * @return {?} An object that encapsulates the animation data.
 *
 */
export function animation(steps, options = null) {
    return { type: 8 /* Reference */, animation: steps, options };
}
/**
 * Executes a queried inner animation element within an animation sequence.
 *
 * \@usageNotes
 * Each time an animation is triggered in Angular, the parent animation
 * has priority and any child animations are blocked. In order
 * for a child animation to run, the parent animation must query each of the elements
 * containing child animations, and run them using this function.
 *
 * Note that this feature designed to be used with `query()` and it will only work
 * with animations that are assigned using the Angular animation library. CSS keyframes
 * and transitions are not handled by this API.
 *
 * \@publicApi
 * @param {?=} options An options object that can contain a delay value for the start of the
 * animation, and additional override values for developer-defined parameters.
 * @return {?} An object that encapsulates the child animation data.
 *
 */
export function animateChild(options = null) {
    return { type: 9 /* AnimateChild */, options };
}
/**
 * Starts a reusable animation that is created using the `animation()` function.
 *
 * \@publicApi
 * @param {?} animation The reusable animation to start.
 * @param {?=} options An options object that can contain a delay value for the start of
 * the animation, and additional override values for developer-defined parameters.
 * @return {?} An object that contains the animation parameters.
 *
 */
export function useAnimation(animation, options = null) {
    return { type: 10 /* AnimateRef */, animation, options };
}
/**
 * Finds one or more inner elements within the current element that is
 * being animated within a sequence. Use with `animateChild()`.
 *
 * \@usageNotes
 * Tokens can be merged into a combined query selector string. For example:
 *
 * ```typescript
 *  query(':self, .record:enter, .record:leave, \@subTrigger', [...])
 * ```
 *
 * The `query()` function collects multiple elements and works internally by using
 * `element.querySelectorAll`. Use the `limit` field of an options object to limit
 * the total number of items to be collected. For example:
 *
 * ```js
 * query('div', [
 *   animate(...),
 *   animate(...)
 * ], { limit: 1 })
 * ```
 *
 * By default, throws an error when zero items are found. Set the
 * `optional` flag to ignore this error. For example:
 *
 * ```js
 * query('.some-element-that-may-not-be-there', [
 *   animate(...),
 *   animate(...)
 * ], { optional: true })
 * ```
 *
 * ### Usage Example
 *
 * The following example queries for inner elements and animates them
 * individually using `animateChild()`.
 *
 * ```typescript
 * \@Component({
 *   selector: 'inner',
 *   template: `
 *     <div [\@queryAnimation]="exp">
 *       <h1>Title</h1>
 *       <div class="content">
 *         Blah blah blah
 *       </div>
 *     </div>
 *   `,
 *   animations: [
 *    trigger('queryAnimation', [
 *      transition('* => goAnimate', [
 *        // hide the inner elements
 *        query('h1', style({ opacity: 0 })),
 *        query('.content', style({ opacity: 0 })),
 *
 *        // animate the inner elements in, one by one
 *        query('h1', animate(1000, style({ opacity: 1 })),
 *        query('.content', animate(1000, style({ opacity: 1 })),
 *      ])
 *    ])
 *  ]
 * })
 * class Cmp {
 *   exp = '';
 *
 *   goAnimate() {
 *     this.exp = 'goAnimate';
 *   }
 * }
 * ```
 *
 * \@publicApi
 * @param {?} selector The element to query, or a set of elements that contain Angular-specific
 * characteristics, specified with one or more of the following tokens.
 *  - `query(":enter")` or `query(":leave")` : Query for newly inserted/removed elements.
 *  - `query(":animating")` : Query all currently animating elements.
 *  - `query("\@triggerName")` : Query elements that contain an animation trigger.
 *  - `query("\@*")` : Query all elements that contain an animation triggers.
 *  - `query(":self")` : Include the current element into the animation sequence.
 *
 * @param {?} animation One or more animation steps to apply to the queried element or elements.
 * An array is treated as an animation sequence.
 * @param {?=} options An options object. Use the 'limit' field to limit the total number of
 * items to collect.
 * @return {?} An object that encapsulates the query data.
 *
 */
export function query(selector, animation, options = null) {
    return { type: 11 /* Query */, selector, animation, options };
}
/**
 * Use within an animation `query()` call to issue a timing gap after
 * each queried item is animated.
 *
 * \@usageNotes
 * In the following example, a container element wraps a list of items stamped out
 * by an `ngFor`. The container element contains an animation trigger that will later be set
 * to query for each of the inner items.
 *
 * Each time items are added, the opacity fade-in animation runs,
 * and each removed item is faded out.
 * When either of these animations occur, the stagger effect is
 * applied after each item's animation is started.
 *
 * ```html
 * <!-- list.component.html -->
 * <button (click)="toggle()">Show / Hide Items</button>
 * <hr />
 * <div [\@listAnimation]="items.length">
 *   <div *ngFor="let item of items">
 *     {{ item }}
 *   </div>
 * </div>
 * ```
 *
 * Here is the component code:
 *
 * ```typescript
 * import {trigger, transition, style, animate, query, stagger} from '\@angular/animations';
 * \@Component({
 *   templateUrl: 'list.component.html',
 *   animations: [
 *     trigger('listAnimation', [
 *     ...
 *     ])
 *   ]
 * })
 * class ListComponent {
 *   items = [];
 *
 *   showItems() {
 *     this.items = [0,1,2,3,4];
 *   }
 *
 *   hideItems() {
 *     this.items = [];
 *   }
 *
 *   toggle() {
 *     this.items.length ? this.hideItems() : this.showItems();
 *    }
 *  }
 * ```
 *
 * Here is the animation trigger code:
 *
 * ```typescript
 * trigger('listAnimation', [
 *   transition('* => *', [ // each time the binding value changes
 *     query(':leave', [
 *       stagger(100, [
 *         animate('0.5s', style({ opacity: 0 }))
 *       ])
 *     ]),
 *     query(':enter', [
 *       style({ opacity: 0 }),
 *       stagger(100, [
 *         animate('0.5s', style({ opacity: 1 }))
 *       ])
 *     ])
 *   ])
 * ])
 * ```
 *
 * \@publicApi
 * @param {?} timings A delay value.
 * @param {?} animation One ore more animation steps.
 * @return {?} An object that encapsulates the stagger data.
 *
 */
export function stagger(timings, animation) {
    return { type: 12 /* Stagger */, timings, animation };
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX21ldGFkYXRhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvYW5pbWF0aW9ucy9zcmMvYW5pbWF0aW9uX21ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFrR0UsUUFBUzs7Ozs7SUFLVCxhQUFjOzs7OztJQUtkLFdBQVk7Ozs7O0lBS1osUUFBUzs7Ozs7SUFLVCxVQUFXOzs7OztJQUtYLFlBQWE7Ozs7O0lBS2IsUUFBUzs7Ozs7SUFLVCxVQUFXOzs7OztJQUtYLFlBQWE7Ozs7O0lBS2IsZUFBZ0I7Ozs7O0lBS2hCLGNBQWU7Ozs7O0lBS2YsU0FBVTs7Ozs7SUFLVixXQUFZOzs7Ozs7OztBQVFkLGFBQWEsVUFBVSxHQUFHLEdBQUcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMmE5QixNQUFNLFVBQVUsT0FBTyxDQUFDLElBQVksRUFBRSxXQUFnQztJQUNwRSxPQUFPLEVBQUMsSUFBSSxpQkFBK0IsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUMsQ0FBQztDQUM5RTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0REQsTUFBTSxVQUFVLE9BQU8sQ0FDbkIsT0FBd0IsRUFBRSxTQUNmLElBQUk7SUFDakIsT0FBTyxFQUFDLElBQUksaUJBQStCLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQy9EOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUNELE1BQU0sVUFBVSxLQUFLLENBQ2pCLEtBQTBCLEVBQUUsVUFBbUMsSUFBSTtJQUNyRSxPQUFPLEVBQUMsSUFBSSxlQUE2QixFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQztDQUM1RDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtDRCxNQUFNLFVBQVUsUUFBUSxDQUFDLEtBQTBCLEVBQUUsVUFBbUMsSUFBSTtJQUUxRixPQUFPLEVBQUMsSUFBSSxrQkFBZ0MsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFDLENBQUM7Q0FDL0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUNELE1BQU0sVUFBVSxLQUFLLENBQ2pCLE1BQzJDO0lBQzdDLE9BQU8sRUFBQyxJQUFJLGVBQTZCLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUM7Q0FDMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUErQkQsTUFBTSxVQUFVLEtBQUssQ0FDakIsSUFBWSxFQUFFLE1BQThCLEVBQzVDLE9BQXlDO0lBQzNDLE9BQU8sRUFBQyxJQUFJLGVBQTZCLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUMsQ0FBQztDQUNuRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0NELE1BQU0sVUFBVSxTQUFTLENBQUMsS0FBK0I7SUFDdkQsT0FBTyxFQUFDLElBQUksbUJBQWlDLEVBQUUsS0FBSyxFQUFDLENBQUM7Q0FDdkQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEtELE1BQU0sVUFBVSxVQUFVLENBQ3RCLGVBQ3NFLEVBQ3RFLEtBQThDLEVBQzlDLFVBQW1DLElBQUk7SUFDekMsT0FBTyxFQUFDLElBQUksb0JBQWtDLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQ25HOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBK0NELE1BQU0sVUFBVSxTQUFTLENBQ3JCLEtBQThDLEVBQzlDLFVBQW1DLElBQUk7SUFDekMsT0FBTyxFQUFDLElBQUksbUJBQWlDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUMsQ0FBQztDQUMzRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFxQkQsTUFBTSxVQUFVLFlBQVksQ0FBQyxVQUFzQyxJQUFJO0lBRXJFLE9BQU8sRUFBQyxJQUFJLHNCQUFvQyxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQzVEOzs7Ozs7Ozs7OztBQVlELE1BQU0sVUFBVSxZQUFZLENBQ3hCLFNBQXFDLEVBQ3JDLFVBQW1DLElBQUk7SUFDekMsT0FBTyxFQUFDLElBQUkscUJBQWtDLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQ3JFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeUZELE1BQU0sVUFBVSxLQUFLLENBQ2pCLFFBQWdCLEVBQUUsU0FBa0QsRUFDcEUsVUFBd0MsSUFBSTtJQUM5QyxPQUFPLEVBQUMsSUFBSSxnQkFBNkIsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBQyxDQUFDO0NBQzFFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFrRkQsTUFBTSxVQUFVLE9BQU8sQ0FDbkIsT0FBd0IsRUFDeEIsU0FBa0Q7SUFDcEQsT0FBTyxFQUFDLElBQUksa0JBQStCLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBQyxDQUFDO0NBQ2xFIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBzZXQgb2YgQ1NTIHN0eWxlcyBmb3IgdXNlIGluIGFuIGFuaW1hdGlvbiBzdHlsZS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSDJtVN0eWxlRGF0YSB7IFtrZXk6IHN0cmluZ106IHN0cmluZ3xudW1iZXI7IH1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGFuaW1hdGlvbi1zdGVwIHRpbWluZyBwYXJhbWV0ZXJzIGZvciBhbiBhbmltYXRpb24gc3RlcC5cbiAqIEBzZWUgYGFuaW1hdGUoKWBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBkZWNsYXJlIHR5cGUgQW5pbWF0ZVRpbWluZ3MgPSB7XG4gIC8qKlxuICAgKiBUaGUgZnVsbCBkdXJhdGlvbiBvZiBhbiBhbmltYXRpb24gc3RlcC4gQSBudW1iZXIgYW5kIG9wdGlvbmFsIHRpbWUgdW5pdCxcbiAgICogc3VjaCBhcyBcIjFzXCIgb3IgXCIxMG1zXCIgZm9yIG9uZSBzZWNvbmQgYW5kIDEwIG1pbGxpc2Vjb25kcywgcmVzcGVjdGl2ZWx5LlxuICAgKiBUaGUgZGVmYXVsdCB1bml0IGlzIG1pbGxpc2Vjb25kcy5cbiAgICovXG4gIGR1cmF0aW9uOiBudW1iZXIsXG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgaW4gYXBwbHlpbmcgYW4gYW5pbWF0aW9uIHN0ZXAuIEEgbnVtYmVyIGFuZCBvcHRpb25hbCB0aW1lIHVuaXQuXG4gICAqIFRoZSBkZWZhdWx0IHVuaXQgaXMgbWlsbGlzZWNvbmRzLlxuICAgKi9cbiAgZGVsYXk6IG51bWJlcixcbiAgLyoqXG4gICAqIEFuIGVhc2luZyBzdHlsZSB0aGF0IGNvbnRyb2xzIGhvdyBhbiBhbmltYXRpb25zIHN0ZXAgYWNjZWxlcmF0ZXNcbiAgICogYW5kIGRlY2VsZXJhdGVzIGR1cmluZyBpdHMgcnVuIHRpbWUuIEFuIGVhc2luZyBmdW5jdGlvbiBzdWNoIGFzIGBjdWJpYy1iZXppZXIoKWAsXG4gICAqIG9yIG9uZSBvZiB0aGUgZm9sbG93aW5nIGNvbnN0YW50czpcbiAgICogLSBgZWFzZS1pbmBcbiAgICogLSBgZWFzZS1vdXRgXG4gICAqIC0gYGVhc2UtaW4tYW5kLW91dGBcbiAgICovXG4gIGVhc2luZzogc3RyaW5nIHwgbnVsbFxufTtcblxuLyoqXG4gKiBAZGVzY3JpcHRpb24gT3B0aW9ucyB0aGF0IGNvbnRyb2wgYW5pbWF0aW9uIHN0eWxpbmcgYW5kIHRpbWluZy5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIGFuaW1hdGlvbiBmdW5jdGlvbnMgYWNjZXB0IGBBbmltYXRpb25PcHRpb25zYCBkYXRhOlxuICpcbiAqIC0gYHRyYW5zaXRpb24oKWBcbiAqIC0gYHNlcXVlbmNlKClgXG4gKiAtIGB7QGxpbmsgYW5pbWF0aW9ucy9ncm91cCBncm91cCgpfWBcbiAqIC0gYHF1ZXJ5KClgXG4gKiAtIGBhbmltYXRpb24oKWBcbiAqIC0gYHVzZUFuaW1hdGlvbigpYFxuICogLSBgYW5pbWF0ZUNoaWxkKClgXG4gKlxuICogUHJvZ3JhbW1hdGljIGFuaW1hdGlvbnMgYnVpbHQgdXNpbmcgdGhlIGBBbmltYXRpb25CdWlsZGVyYCBzZXJ2aWNlIGFsc29cbiAqIG1ha2UgdXNlIG9mIGBBbmltYXRpb25PcHRpb25zYC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBBbmltYXRpb25PcHRpb25zIHtcbiAgLyoqXG4gICAqIFNldHMgYSB0aW1lLWRlbGF5IGZvciBpbml0aWF0aW5nIGFuIGFuaW1hdGlvbiBhY3Rpb24uXG4gICAqIEEgbnVtYmVyIGFuZCBvcHRpb25hbCB0aW1lIHVuaXQsIHN1Y2ggYXMgXCIxc1wiIG9yIFwiMTBtc1wiIGZvciBvbmUgc2Vjb25kXG4gICAqIGFuZCAxMCBtaWxsaXNlY29uZHMsIHJlc3BlY3RpdmVseS5UaGUgZGVmYXVsdCB1bml0IGlzIG1pbGxpc2Vjb25kcy5cbiAgICogRGVmYXVsdCB2YWx1ZSBpcyAwLCBtZWFuaW5nIG5vIGRlbGF5LlxuICAgKi9cbiAgZGVsYXk/OiBudW1iZXJ8c3RyaW5nO1xuICAvKipcbiAgKiBBIHNldCBvZiBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzIHRoYXQgbW9kaWZ5IHN0eWxpbmcgYW5kIHRpbWluZ1xuICAqIHdoZW4gYW4gYW5pbWF0aW9uIGFjdGlvbiBzdGFydHMuIEFuIGFycmF5IG9mIGtleS12YWx1ZSBwYWlycywgd2hlcmUgdGhlIHByb3ZpZGVkIHZhbHVlXG4gICogaXMgdXNlZCBhcyBhIGRlZmF1bHQuXG4gICovXG4gIHBhcmFtcz86IHtbbmFtZTogc3RyaW5nXTogYW55fTtcbn1cblxuLyoqXG4gKiBBZGRzIGR1cmF0aW9uIG9wdGlvbnMgdG8gY29udHJvbCBhbmltYXRpb24gc3R5bGluZyBhbmQgdGltaW5nIGZvciBhIGNoaWxkIGFuaW1hdGlvbi5cbiAqXG4gKiBAc2VlIGBhbmltYXRlQ2hpbGQoKWBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBkZWNsYXJlIGludGVyZmFjZSBBbmltYXRlQ2hpbGRPcHRpb25zIGV4dGVuZHMgQW5pbWF0aW9uT3B0aW9ucyB7IGR1cmF0aW9uPzogbnVtYmVyfHN0cmluZzsgfVxuXG4vKipcbiAqIEBkZXNjcmlwdGlvbiBDb25zdGFudHMgZm9yIHRoZSBjYXRlZ29yaWVzIG9mIHBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgZGVmaW5lZCBmb3IgYW5pbWF0aW9ucy5cbiAqXG4gKiBBIGNvcnJlc3BvbmRpbmcgZnVuY3Rpb24gZGVmaW5lcyBhIHNldCBvZiBwYXJhbWV0ZXJzIGZvciBlYWNoIGNhdGVnb3J5LCBhbmRcbiAqIGNvbGxlY3RzIHRoZW0gaW50byBhIGNvcnJlc3BvbmRpbmcgYEFuaW1hdGlvbk1ldGFkYXRhYCBvYmplY3QuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZW51bSBBbmltYXRpb25NZXRhZGF0YVR5cGUge1xuICAvKipcbiAgICogQXNzb2NpYXRlcyBhIG5hbWVkIGFuaW1hdGlvbiBzdGF0ZSB3aXRoIGEgc2V0IG9mIENTUyBzdHlsZXMuXG4gICAqIFNlZSBgc3RhdGUoKWBcbiAgICovXG4gIFN0YXRlID0gMCxcbiAgLyoqXG4gICAqIERhdGEgZm9yIGEgdHJhbnNpdGlvbiBmcm9tIG9uZSBhbmltYXRpb24gc3RhdGUgdG8gYW5vdGhlci5cbiAgICogU2VlIGB0cmFuc2l0aW9uKClgXG4gICAqL1xuICBUcmFuc2l0aW9uID0gMSxcbiAgLyoqXG4gICAqIENvbnRhaW5zIGEgc2V0IG9mIGFuaW1hdGlvbiBzdGVwcy5cbiAgICogU2VlIGBzZXF1ZW5jZSgpYFxuICAgKi9cbiAgU2VxdWVuY2UgPSAyLFxuICAvKipcbiAgICogQ29udGFpbnMgYSBzZXQgb2YgYW5pbWF0aW9uIHN0ZXBzLlxuICAgKiBTZWUgYHtAbGluayBhbmltYXRpb25zL2dyb3VwIGdyb3VwKCl9YFxuICAgKi9cbiAgR3JvdXAgPSAzLFxuICAvKipcbiAgICogQ29udGFpbnMgYW4gYW5pbWF0aW9uIHN0ZXAuXG4gICAqIFNlZSBgYW5pbWF0ZSgpYFxuICAgKi9cbiAgQW5pbWF0ZSA9IDQsXG4gIC8qKlxuICAgKiBDb250YWlucyBhIHNldCBvZiBhbmltYXRpb24gc3RlcHMuXG4gICAqIFNlZSBga2V5ZnJhbWVzKClgXG4gICAqL1xuICBLZXlmcmFtZXMgPSA1LFxuICAvKipcbiAgICogQ29udGFpbnMgYSBzZXQgb2YgQ1NTIHByb3BlcnR5LXZhbHVlIHBhaXJzIGludG8gYSBuYW1lZCBzdHlsZS5cbiAgICogU2VlIGBzdHlsZSgpYFxuICAgKi9cbiAgU3R5bGUgPSA2LFxuICAvKipcbiAgICogQXNzb2NpYXRlcyBhbiBhbmltYXRpb24gd2l0aCBhbiBlbnRyeSB0cmlnZ2VyIHRoYXQgY2FuIGJlIGF0dGFjaGVkIHRvIGFuIGVsZW1lbnQuXG4gICAqIFNlZSBgdHJpZ2dlcigpYFxuICAgKi9cbiAgVHJpZ2dlciA9IDcsXG4gIC8qKlxuICAgKiBDb250YWlucyBhIHJlLXVzYWJsZSBhbmltYXRpb24uXG4gICAqIFNlZSBgYW5pbWF0aW9uKClgXG4gICAqL1xuICBSZWZlcmVuY2UgPSA4LFxuICAvKipcbiAgICogQ29udGFpbnMgZGF0YSB0byB1c2UgaW4gZXhlY3V0aW5nIGNoaWxkIGFuaW1hdGlvbnMgcmV0dXJuZWQgYnkgYSBxdWVyeS5cbiAgICogU2VlIGBhbmltYXRlQ2hpbGQoKWBcbiAgICovXG4gIEFuaW1hdGVDaGlsZCA9IDksXG4gIC8qKlxuICAgKiBDb250YWlucyBhbmltYXRpb24gcGFyYW1ldGVycyBmb3IgYSByZS11c2FibGUgYW5pbWF0aW9uLlxuICAgKiBTZWUgYHVzZUFuaW1hdGlvbigpYFxuICAgKi9cbiAgQW5pbWF0ZVJlZiA9IDEwLFxuICAvKipcbiAgICogQ29udGFpbnMgY2hpbGQtYW5pbWF0aW9uIHF1ZXJ5IGRhdGEuXG4gICAqIFNlZSBgcXVlcnkoKWBcbiAgICovXG4gIFF1ZXJ5ID0gMTEsXG4gIC8qKlxuICAgKiBDb250YWlucyBkYXRhIGZvciBzdGFnZ2VyaW5nIGFuIGFuaW1hdGlvbiBzZXF1ZW5jZS5cbiAgICogU2VlIGBzdGFnZ2VyKClgXG4gICAqL1xuICBTdGFnZ2VyID0gMTJcbn1cblxuLyoqXG4gKiBTcGVjaWZpZXMgYXV0b21hdGljIHN0eWxpbmcuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgQVVUT19TVFlMRSA9ICcqJztcblxuLyoqXG4gKiBCYXNlIGZvciBhbmltYXRpb24gZGF0YSBzdHJ1Y3R1cmVzLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25NZXRhZGF0YSB7IHR5cGU6IEFuaW1hdGlvbk1ldGFkYXRhVHlwZTsgfVxuXG4vKipcbiAqIENvbnRhaW5zIGFuIGFuaW1hdGlvbiB0cmlnZ2VyLiBJbnN0YW50aWF0ZWQgYW5kIHJldHVybmVkIGJ5IHRoZVxuICogYHRyaWdnZXIoKWAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1hdGlvblRyaWdnZXJNZXRhZGF0YSBleHRlbmRzIEFuaW1hdGlvbk1ldGFkYXRhIHtcbiAgLyoqXG4gICAgKiBUaGUgdHJpZ2dlciBuYW1lLCB1c2VkIHRvIGFzc29jaWF0ZSBpdCB3aXRoIGFuIGVsZW1lbnQuIFVuaXF1ZSB3aXRoaW4gdGhlIGNvbXBvbmVudC5cbiAgICAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBBbiBhbmltYXRpb24gZGVmaW5pdGlvbiBvYmplY3QsIGNvbnRhaW5pbmcgYW4gYXJyYXkgb2Ygc3RhdGUgYW5kIHRyYW5zaXRpb24gZGVjbGFyYXRpb25zLlxuICAgKi9cbiAgZGVmaW5pdGlvbnM6IEFuaW1hdGlvbk1ldGFkYXRhW107XG4gIC8qKlxuICAgKiBBbiBvcHRpb25zIG9iamVjdCBjb250YWluaW5nIGEgZGVsYXkgYW5kXG4gICAqIGRldmVsb3Blci1kZWZpbmVkIHBhcmFtZXRlcnMgdGhhdCBwcm92aWRlIHN0eWxpbmcgZGVmYXVsdHMgYW5kXG4gICAqIGNhbiBiZSBvdmVycmlkZGVuIG9uIGludm9jYXRpb24uIERlZmF1bHQgZGVsYXkgaXMgMC5cbiAgICovXG4gIG9wdGlvbnM6IHtwYXJhbXM/OiB7W25hbWU6IHN0cmluZ106IGFueX19fG51bGw7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGFuIGFuaW1hdGlvbiBzdGF0ZSBieSBhc3NvY2lhdGluZyBhIHN0YXRlIG5hbWUgd2l0aCBhIHNldCBvZiBDU1Mgc3R5bGVzLlxuICogSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGUgYHN0YXRlKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25TdGF0ZU1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogVGhlIHN0YXRlIG5hbWUsIHVuaXF1ZSB3aXRoaW4gdGhlIGNvbXBvbmVudC5cbiAgICovXG4gIG5hbWU6IHN0cmluZztcbiAgLyoqXG4gICAqICBUaGUgQ1NTIHN0eWxlcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBzdGF0ZS5cbiAgICovXG4gIHN0eWxlczogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YTtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbnMgb2JqZWN0IGNvbnRhaW5pbmdcbiAgICogZGV2ZWxvcGVyLWRlZmluZWQgcGFyYW1ldGVycyB0aGF0IHByb3ZpZGUgc3R5bGluZyBkZWZhdWx0cyBhbmRcbiAgICogY2FuIGJlIG92ZXJyaWRkZW4gb24gaW52b2NhdGlvbi5cbiAgICovXG4gIG9wdGlvbnM/OiB7cGFyYW1zOiB7W25hbWU6IHN0cmluZ106IGFueX19O1xufVxuXG4vKipcbiAqIEVuY2Fwc3VsYXRlcyBhbiBhbmltYXRpb24gdHJhbnNpdGlvbi4gSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGVcbiAqIGB0cmFuc2l0aW9uKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25UcmFuc2l0aW9uTWV0YWRhdGEgZXh0ZW5kcyBBbmltYXRpb25NZXRhZGF0YSB7XG4gIC8qKlxuICAgKiBBbiBleHByZXNzaW9uIHRoYXQgZGVzY3JpYmVzIGEgc3RhdGUgY2hhbmdlLlxuICAgKi9cbiAgZXhwcjogc3RyaW5nfFxuICAgICAgKChmcm9tU3RhdGU6IHN0cmluZywgdG9TdGF0ZTogc3RyaW5nLCBlbGVtZW50PzogYW55LFxuICAgICAgICBwYXJhbXM/OiB7W2tleTogc3RyaW5nXTogYW55fSkgPT4gYm9vbGVhbik7XG4gIC8qKlxuICAgKiBPbmUgb3IgbW9yZSBhbmltYXRpb24gb2JqZWN0cyB0byB3aGljaCB0aGlzIHRyYW5zaXRpb24gYXBwbGllcy5cbiAgICovXG4gIGFuaW1hdGlvbjogQW5pbWF0aW9uTWV0YWRhdGF8QW5pbWF0aW9uTWV0YWRhdGFbXTtcbiAgLyoqXG4gICAqIEFuIG9wdGlvbnMgb2JqZWN0IGNvbnRhaW5pbmcgYSBkZWxheSBhbmRcbiAgICogZGV2ZWxvcGVyLWRlZmluZWQgcGFyYW1ldGVycyB0aGF0IHByb3ZpZGUgc3R5bGluZyBkZWZhdWx0cyBhbmRcbiAgICogY2FuIGJlIG92ZXJyaWRkZW4gb24gaW52b2NhdGlvbi4gRGVmYXVsdCBkZWxheSBpcyAwLlxuICAgKi9cbiAgb3B0aW9uczogQW5pbWF0aW9uT3B0aW9uc3xudWxsO1xufVxuXG4vKipcbiAqIEVuY2Fwc3VsYXRlcyBhIHJldXNhYmxlIGFuaW1hdGlvbiwgd2hpY2ggaXMgYSBjb2xsZWN0aW9uIG9mIGluZGl2aWR1YWwgYW5pbWF0aW9uIHN0ZXBzLlxuICogSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGUgYGFuaW1hdGlvbigpYCBmdW5jdGlvbiwgYW5kXG4gKiBwYXNzZWQgdG8gdGhlIGB1c2VBbmltYXRpb24oKWAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1hdGlvblJlZmVyZW5jZU1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogIE9uZSBvciBtb3JlIGFuaW1hdGlvbiBzdGVwIG9iamVjdHMuXG4gICAqL1xuICBhbmltYXRpb246IEFuaW1hdGlvbk1ldGFkYXRhfEFuaW1hdGlvbk1ldGFkYXRhW107XG4gIC8qKlxuICAgKiBBbiBvcHRpb25zIG9iamVjdCBjb250YWluaW5nIGEgZGVsYXkgYW5kXG4gICAqIGRldmVsb3Blci1kZWZpbmVkIHBhcmFtZXRlcnMgdGhhdCBwcm92aWRlIHN0eWxpbmcgZGVmYXVsdHMgYW5kXG4gICAqIGNhbiBiZSBvdmVycmlkZGVuIG9uIGludm9jYXRpb24uIERlZmF1bHQgZGVsYXkgaXMgMC5cbiAgICovXG4gIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnN8bnVsbDtcbn1cblxuLyoqXG4gKiBFbmNhcHN1bGF0ZXMgYW4gYW5pbWF0aW9uIHF1ZXJ5LiBJbnN0YW50aWF0ZWQgYW5kIHJldHVybmVkIGJ5XG4gKiB0aGUgYHF1ZXJ5KClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25RdWVyeU1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogIFRoZSBDU1Mgc2VsZWN0b3IgZm9yIHRoaXMgcXVlcnkuXG4gICAqL1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICAvKipcbiAgICogT25lIG9yIG1vcmUgYW5pbWF0aW9uIHN0ZXAgb2JqZWN0cy5cbiAgICovXG4gIGFuaW1hdGlvbjogQW5pbWF0aW9uTWV0YWRhdGF8QW5pbWF0aW9uTWV0YWRhdGFbXTtcbiAgLyoqXG4gICAqIEEgcXVlcnkgb3B0aW9ucyBvYmplY3QuXG4gICAqL1xuICBvcHRpb25zOiBBbmltYXRpb25RdWVyeU9wdGlvbnN8bnVsbDtcbn1cblxuLyoqXG4gKiBFbmNhcHN1bGF0ZXMgYSBrZXlmcmFtZXMgc2VxdWVuY2UuIEluc3RhbnRpYXRlZCBhbmQgcmV0dXJuZWQgYnlcbiAqIHRoZSBga2V5ZnJhbWVzKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBBbmltYXRpb25LZXlmcmFtZXNTZXF1ZW5jZU1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogQW4gYXJyYXkgb2YgYW5pbWF0aW9uIHN0eWxlcy5cbiAgICovXG4gIHN0ZXBzOiBBbmltYXRpb25TdHlsZU1ldGFkYXRhW107XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGFuIGFuaW1hdGlvbiBzdHlsZS4gSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieVxuICogdGhlIGBzdHlsZSgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uU3R5bGVNZXRhZGF0YSBleHRlbmRzIEFuaW1hdGlvbk1ldGFkYXRhIHtcbiAgLyoqXG4gICAqIEEgc2V0IG9mIENTUyBzdHlsZSBwcm9wZXJ0aWVzLlxuICAgKi9cbiAgc3R5bGVzOiAnKid8e1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bWJlcn18QXJyYXk8e1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bWJlcn18JyonPjtcbiAgLyoqXG4gICAqIEEgcGVyY2VudGFnZSBvZiB0aGUgdG90YWwgYW5pbWF0ZSB0aW1lIGF0IHdoaWNoIHRoZSBzdHlsZSBpcyB0byBiZSBhcHBsaWVkLlxuICAgKi9cbiAgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbn1cblxuLyoqXG4gKiBFbmNhcHN1bGF0ZXMgYW4gYW5pbWF0aW9uIHN0ZXAuIEluc3RhbnRpYXRlZCBhbmQgcmV0dXJuZWQgYnlcbiAqIHRoZSBgYW5pbWF0ZSgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uQW5pbWF0ZU1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogVGhlIHRpbWluZyBkYXRhIGZvciB0aGUgc3RlcC5cbiAgICovXG4gIHRpbWluZ3M6IHN0cmluZ3xudW1iZXJ8QW5pbWF0ZVRpbWluZ3M7XG4gIC8qKlxuICAgKiBBIHNldCBvZiBzdHlsZXMgdXNlZCBpbiB0aGUgc3RlcC5cbiAgICovXG4gIHN0eWxlczogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YXxBbmltYXRpb25LZXlmcmFtZXNTZXF1ZW5jZU1ldGFkYXRhfG51bGw7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGEgY2hpbGQgYW5pbWF0aW9uLCB0aGF0IGNhbiBiZSBydW4gZXhwbGljaXRseSB3aGVuIHRoZSBwYXJlbnQgaXMgcnVuLlxuICogSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGUgYGFuaW1hdGVDaGlsZGAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEFuaW1hdGlvbkFuaW1hdGVDaGlsZE1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogQW4gb3B0aW9ucyBvYmplY3QgY29udGFpbmluZyBhIGRlbGF5IGFuZFxuICAgKiBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzIHRoYXQgcHJvdmlkZSBzdHlsaW5nIGRlZmF1bHRzIGFuZFxuICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBvbiBpbnZvY2F0aW9uLiBEZWZhdWx0IGRlbGF5IGlzIDAuXG4gICAqL1xuICBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zfG51bGw7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGEgcmV1c2FibGUgYW5pbWF0aW9uLlxuICogSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGUgYHVzZUFuaW1hdGlvbigpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uQW5pbWF0ZVJlZk1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogQW4gYW5pbWF0aW9uIHJlZmVyZW5jZSBvYmplY3QuXG4gICAqL1xuICBhbmltYXRpb246IEFuaW1hdGlvblJlZmVyZW5jZU1ldGFkYXRhO1xuICAvKipcbiAgICogQW4gb3B0aW9ucyBvYmplY3QgY29udGFpbmluZyBhIGRlbGF5IGFuZFxuICAgKiBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzIHRoYXQgcHJvdmlkZSBzdHlsaW5nIGRlZmF1bHRzIGFuZFxuICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBvbiBpbnZvY2F0aW9uLiBEZWZhdWx0IGRlbGF5IGlzIDAuXG4gICAqL1xuICBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zfG51bGw7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGFuIGFuaW1hdGlvbiBzZXF1ZW5jZS5cbiAqIEluc3RhbnRpYXRlZCBhbmQgcmV0dXJuZWQgYnkgdGhlIGBzZXF1ZW5jZSgpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uU2VxdWVuY2VNZXRhZGF0YSBleHRlbmRzIEFuaW1hdGlvbk1ldGFkYXRhIHtcbiAgLyoqXG4gICAqICBBbiBhcnJheSBvZiBhbmltYXRpb24gc3RlcCBvYmplY3RzLlxuICAgKi9cbiAgc3RlcHM6IEFuaW1hdGlvbk1ldGFkYXRhW107XG4gIC8qKlxuICAgKiBBbiBvcHRpb25zIG9iamVjdCBjb250YWluaW5nIGEgZGVsYXkgYW5kXG4gICAqIGRldmVsb3Blci1kZWZpbmVkIHBhcmFtZXRlcnMgdGhhdCBwcm92aWRlIHN0eWxpbmcgZGVmYXVsdHMgYW5kXG4gICAqIGNhbiBiZSBvdmVycmlkZGVuIG9uIGludm9jYXRpb24uIERlZmF1bHQgZGVsYXkgaXMgMC5cbiAgICovXG4gIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnN8bnVsbDtcbn1cblxuLyoqXG4gKiBFbmNhcHN1bGF0ZXMgYW4gYW5pbWF0aW9uIGdyb3VwLlxuICogSW5zdGFudGlhdGVkIGFuZCByZXR1cm5lZCBieSB0aGUgYHtAbGluayBhbmltYXRpb25zL2dyb3VwIGdyb3VwKCl9YCBmdW5jdGlvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uR3JvdXBNZXRhZGF0YSBleHRlbmRzIEFuaW1hdGlvbk1ldGFkYXRhIHtcbiAgLyoqXG4gICAqIE9uZSBvciBtb3JlIGFuaW1hdGlvbiBvciBzdHlsZSBzdGVwcyB0aGF0IGZvcm0gdGhpcyBncm91cC5cbiAgICovXG4gIHN0ZXBzOiBBbmltYXRpb25NZXRhZGF0YVtdO1xuICAvKipcbiAgICogQW4gb3B0aW9ucyBvYmplY3QgY29udGFpbmluZyBhIGRlbGF5IGFuZFxuICAgKiBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzIHRoYXQgcHJvdmlkZSBzdHlsaW5nIGRlZmF1bHRzIGFuZFxuICAgKiBjYW4gYmUgb3ZlcnJpZGRlbiBvbiBpbnZvY2F0aW9uLiBEZWZhdWx0IGRlbGF5IGlzIDAuXG4gICAqL1xuICBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zfG51bGw7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIGFuaW1hdGlvbiBxdWVyeSBvcHRpb25zLlxuICogUGFzc2VkIHRvIHRoZSBgcXVlcnkoKWAgZnVuY3Rpb24uXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZGVjbGFyZSBpbnRlcmZhY2UgQW5pbWF0aW9uUXVlcnlPcHRpb25zIGV4dGVuZHMgQW5pbWF0aW9uT3B0aW9ucyB7XG4gIC8qKlxuICAgKiBUcnVlIGlmIHRoaXMgcXVlcnkgaXMgb3B0aW9uYWwsIGZhbHNlIGlmIGl0IGlzIHJlcXVpcmVkLiBEZWZhdWx0IGlzIGZhbHNlLlxuICAgKiBBIHJlcXVpcmVkIHF1ZXJ5IHRocm93cyBhbiBlcnJvciBpZiBubyBlbGVtZW50cyBhcmUgcmV0cmlldmVkIHdoZW5cbiAgICogdGhlIHF1ZXJ5IGlzIGV4ZWN1dGVkLiBBbiBvcHRpb25hbCBxdWVyeSBkb2VzIG5vdC5cbiAgICpcbiAgICovXG4gIG9wdGlvbmFsPzogYm9vbGVhbjtcbiAgLyoqXG4gICAqIEEgbWF4aW11bSB0b3RhbCBudW1iZXIgb2YgcmVzdWx0cyB0byByZXR1cm4gZnJvbSB0aGUgcXVlcnkuXG4gICAqIElmIG5lZ2F0aXZlLCByZXN1bHRzIGFyZSBsaW1pdGVkIGZyb20gdGhlIGVuZCBvZiB0aGUgcXVlcnkgbGlzdCB0b3dhcmRzIHRoZSBiZWdpbm5pbmcuXG4gICAqIEJ5IGRlZmF1bHQsIHJlc3VsdHMgYXJlIG5vdCBsaW1pdGVkLlxuICAgKi9cbiAgbGltaXQ/OiBudW1iZXI7XG59XG5cbi8qKlxuICogRW5jYXBzdWxhdGVzIHBhcmFtZXRlcnMgZm9yIHN0YWdnZXJpbmcgdGhlIHN0YXJ0IHRpbWVzIG9mIGEgc2V0IG9mIGFuaW1hdGlvbiBzdGVwcy5cbiAqIEluc3RhbnRpYXRlZCBhbmQgcmV0dXJuZWQgYnkgdGhlIGBzdGFnZ2VyKClgIGZ1bmN0aW9uLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqKi9cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0aW9uU3RhZ2dlck1ldGFkYXRhIGV4dGVuZHMgQW5pbWF0aW9uTWV0YWRhdGEge1xuICAvKipcbiAgICogVGhlIHRpbWluZyBkYXRhIGZvciB0aGUgc3RlcHMuXG4gICAqL1xuICB0aW1pbmdzOiBzdHJpbmd8bnVtYmVyO1xuICAvKipcbiAgICogT25lIG9yIG1vcmUgYW5pbWF0aW9uIHN0ZXBzLlxuICAgKi9cbiAgYW5pbWF0aW9uOiBBbmltYXRpb25NZXRhZGF0YXxBbmltYXRpb25NZXRhZGF0YVtdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYW1lZCBhbmltYXRpb24gdHJpZ2dlciwgY29udGFpbmluZyBhICBsaXN0IG9mIGBzdGF0ZSgpYFxuICogYW5kIGB0cmFuc2l0aW9uKClgIGVudHJpZXMgdG8gYmUgZXZhbHVhdGVkIHdoZW4gdGhlIGV4cHJlc3Npb25cbiAqIGJvdW5kIHRvIHRoZSB0cmlnZ2VyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIG5hbWUgQW4gaWRlbnRpZnlpbmcgc3RyaW5nLlxuICogQHBhcmFtIGRlZmluaXRpb25zICBBbiBhbmltYXRpb24gZGVmaW5pdGlvbiBvYmplY3QsIGNvbnRhaW5pbmcgYW4gYXJyYXkgb2YgYHN0YXRlKClgXG4gKiBhbmQgYHRyYW5zaXRpb24oKWAgZGVjbGFyYXRpb25zLlxuICpcbiAqIEByZXR1cm4gQW4gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSB0cmlnZ2VyIGRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIERlZmluZSBhbiBhbmltYXRpb24gdHJpZ2dlciBpbiB0aGUgYGFuaW1hdGlvbnNgIHNlY3Rpb24gb2YgYEBDb21wb25lbnRgIG1ldGFkYXRhLlxuICogSW4gdGhlIHRlbXBsYXRlLCByZWZlcmVuY2UgdGhlIHRyaWdnZXIgYnkgbmFtZSBhbmQgYmluZCBpdCB0byBhIHRyaWdnZXIgZXhwcmVzc2lvbiB0aGF0XG4gKiBldmFsdWF0ZXMgdG8gYSBkZWZpbmVkIGFuaW1hdGlvbiBzdGF0ZSwgdXNpbmcgdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKlxuICogYFtAdHJpZ2dlck5hbWVdPVwiZXhwcmVzc2lvblwiYFxuICpcbiAqIEFuaW1hdGlvbiB0cmlnZ2VyIGJpbmRpbmdzIGNvbnZlcnQgYWxsIHZhbHVlcyB0byBzdHJpbmdzLCBhbmQgdGhlbiBtYXRjaCB0aGVcbiAqIHByZXZpb3VzIGFuZCBjdXJyZW50IHZhbHVlcyBhZ2FpbnN0IGFueSBsaW5rZWQgdHJhbnNpdGlvbnMuXG4gKiBCb29sZWFucyBjYW4gYmUgc3BlY2lmaWVkIGFzIGAxYCBvciBgdHJ1ZWAgYW5kIGAwYCBvciBgZmFsc2VgLlxuICpcbiAqICMjIyBVc2FnZSBFeGFtcGxlXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIGNyZWF0ZXMgYW4gYW5pbWF0aW9uIHRyaWdnZXIgcmVmZXJlbmNlIGJhc2VkIG9uIHRoZSBwcm92aWRlZFxuICogbmFtZSB2YWx1ZS5cbiAqIFRoZSBwcm92aWRlZCBhbmltYXRpb24gdmFsdWUgaXMgZXhwZWN0ZWQgdG8gYmUgYW4gYXJyYXkgY29uc2lzdGluZyBvZiBzdGF0ZSBhbmRcbiAqIHRyYW5zaXRpb24gZGVjbGFyYXRpb25zLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogXCJteS1jb21wb25lbnRcIixcbiAqICAgdGVtcGxhdGVVcmw6IFwibXktY29tcG9uZW50LXRwbC5odG1sXCIsXG4gKiAgIGFuaW1hdGlvbnM6IFtcbiAqICAgICB0cmlnZ2VyKFwibXlBbmltYXRpb25UcmlnZ2VyXCIsIFtcbiAqICAgICAgIHN0YXRlKC4uLiksXG4gKiAgICAgICBzdGF0ZSguLi4pLFxuICogICAgICAgdHJhbnNpdGlvbiguLi4pLFxuICogICAgICAgdHJhbnNpdGlvbiguLi4pXG4gKiAgICAgXSlcbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgbXlTdGF0dXNFeHAgPSBcInNvbWV0aGluZ1wiO1xuICogfVxuICogYGBgXG4gKlxuICogVGhlIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIGNvbXBvbmVudCBtYWtlcyB1c2Ugb2YgdGhlIGRlZmluZWQgdHJpZ2dlclxuICogYnkgYmluZGluZyB0byBhbiBlbGVtZW50IHdpdGhpbiBpdHMgdGVtcGxhdGUgY29kZS5cbiAqXG4gKiBgYGBodG1sXG4gKiA8IS0tIHNvbWV3aGVyZSBpbnNpZGUgb2YgbXktY29tcG9uZW50LXRwbC5odG1sIC0tPlxuICogPGRpdiBbQG15QW5pbWF0aW9uVHJpZ2dlcl09XCJteVN0YXR1c0V4cFwiPi4uLjwvZGl2PlxuICogYGBgXG4gKlxuICogIyMjIFVzaW5nIGFuIGlubGluZSBmdW5jdGlvblxuICogVGhlIGB0cmFuc2l0aW9uYCBhbmltYXRpb24gbWV0aG9kIGFsc28gc3VwcG9ydHMgcmVhZGluZyBhbiBpbmxpbmUgZnVuY3Rpb24gd2hpY2ggY2FuIGRlY2lkZVxuICogaWYgaXRzIGFzc29jaWF0ZWQgYW5pbWF0aW9uIHNob3VsZCBiZSBydW4uXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gdGhpcyBtZXRob2QgaXMgcnVuIGVhY2ggdGltZSB0aGUgYG15QW5pbWF0aW9uVHJpZ2dlcmAgdHJpZ2dlciB2YWx1ZSBjaGFuZ2VzLlxuICogZnVuY3Rpb24gbXlJbmxpbmVNYXRjaGVyRm4oZnJvbVN0YXRlOiBzdHJpbmcsIHRvU3RhdGU6IHN0cmluZywgZWxlbWVudDogYW55LCBwYXJhbXM6IHtba2V5OlxuIHN0cmluZ106IGFueX0pOiBib29sZWFuIHtcbiAqICAgLy8gbm90aWNlIHRoYXQgYGVsZW1lbnRgIGFuZCBgcGFyYW1zYCBhcmUgYWxzbyBhdmFpbGFibGUgaGVyZVxuICogICByZXR1cm4gdG9TdGF0ZSA9PSAneWVzLXBsZWFzZS1hbmltYXRlJztcbiAqIH1cbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc2VsZWN0b3I6ICdteS1jb21wb25lbnQnLFxuICogICB0ZW1wbGF0ZVVybDogJ215LWNvbXBvbmVudC10cGwuaHRtbCcsXG4gKiAgIGFuaW1hdGlvbnM6IFtcbiAqICAgICB0cmlnZ2VyKCdteUFuaW1hdGlvblRyaWdnZXInLCBbXG4gKiAgICAgICB0cmFuc2l0aW9uKG15SW5saW5lTWF0Y2hlckZuLCBbXG4gKiAgICAgICAgIC8vIHRoZSBhbmltYXRpb24gc2VxdWVuY2UgY29kZVxuICogICAgICAgXSksXG4gKiAgICAgXSlcbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgbXlTdGF0dXNFeHAgPSBcInllcy1wbGVhc2UtYW5pbWF0ZVwiO1xuICogfVxuICogYGBgXG4gKlxuICogIyMjIERpc2FibGluZyBBbmltYXRpb25zXG4gKiBXaGVuIHRydWUsIHRoZSBzcGVjaWFsIGFuaW1hdGlvbiBjb250cm9sIGJpbmRpbmcgYEAuZGlzYWJsZWRgIGJpbmRpbmcgcHJldmVudHNcbiAqIGFsbCBhbmltYXRpb25zIGZyb20gcmVuZGVyaW5nLlxuICogUGxhY2UgdGhlICBgQC5kaXNhYmxlZGAgYmluZGluZyBvbiBhbiBlbGVtZW50IHRvIGRpc2FibGVcbiAqIGFuaW1hdGlvbnMgb24gdGhlIGVsZW1lbnQgaXRzZWxmLCBhcyB3ZWxsIGFzIGFueSBpbm5lciBhbmltYXRpb24gdHJpZ2dlcnNcbiAqIHdpdGhpbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGUgc2hvd3MgaG93IHRvIHVzZSB0aGlzIGZlYXR1cmU6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnbXktY29tcG9uZW50JyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgICA8ZGl2IFtALmRpc2FibGVkXT1cImlzRGlzYWJsZWRcIj5cbiAqICAgICAgIDxkaXYgW0BjaGlsZEFuaW1hdGlvbl09XCJleHBcIj48L2Rpdj5cbiAqICAgICA8L2Rpdj5cbiAqICAgYCxcbiAqICAgYW5pbWF0aW9uczogW1xuICogICAgIHRyaWdnZXIoXCJjaGlsZEFuaW1hdGlvblwiLCBbXG4gKiAgICAgICAvLyAuLi5cbiAqICAgICBdKVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBpc0Rpc2FibGVkID0gdHJ1ZTtcbiAqICAgZXhwID0gJy4uLic7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBXaGVuIGBALmRpc2FibGVkYCBpcyB0cnVlLCBpdCBwcmV2ZW50cyB0aGUgYEBjaGlsZEFuaW1hdGlvbmAgdHJpZ2dlciBmcm9tIGFuaW1hdGluZyxcbiAqIGFsb25nIHdpdGggYW55IGlubmVyIGFuaW1hdGlvbnMuXG4gKlxuICogIyMjIERpc2FibGUgYW5pbWF0aW9ucyBhcHBsaWNhdGlvbi13aWRlXG4gKiBXaGVuIGFuIGFyZWEgb2YgdGhlIHRlbXBsYXRlIGlzIHNldCB0byBoYXZlIGFuaW1hdGlvbnMgZGlzYWJsZWQsXG4gKiAqKmFsbCoqIGlubmVyIGNvbXBvbmVudHMgaGF2ZSB0aGVpciBhbmltYXRpb25zIGRpc2FibGVkIGFzIHdlbGwuXG4gKiBUaGlzIG1lYW5zIHRoYXQgeW91IGNhbiBkaXNhYmxlIGFsbCBhbmltYXRpb25zIGZvciBhbiBhcHBcbiAqIGJ5IHBsYWNpbmcgYSBob3N0IGJpbmRpbmcgc2V0IG9uIGBALmRpc2FibGVkYCBvbiB0aGUgdG9wbW9zdCBBbmd1bGFyIGNvbXBvbmVudC5cbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge0NvbXBvbmVudCwgSG9zdEJpbmRpbmd9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ2FwcC1jb21wb25lbnQnLFxuICogICB0ZW1wbGF0ZVVybDogJ2FwcC5jb21wb25lbnQuaHRtbCcsXG4gKiB9KVxuICogY2xhc3MgQXBwQ29tcG9uZW50IHtcbiAqICAgQEhvc3RCaW5kaW5nKCdALmRpc2FibGVkJylcbiAqICAgcHVibGljIGFuaW1hdGlvbnNEaXNhYmxlZCA9IHRydWU7XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiAjIyMgT3ZlcnJpZGluZyBkaXNhYmxlbWVudCBvZiBpbm5lciBhbmltYXRpb25zXG4gKiBEZXNwaXRlIGlubmVyIGFuaW1hdGlvbnMgYmVpbmcgZGlzYWJsZWQsIGEgcGFyZW50IGFuaW1hdGlvbiBjYW4gYHF1ZXJ5KClgXG4gKiBmb3IgaW5uZXIgZWxlbWVudHMgbG9jYXRlZCBpbiBkaXNhYmxlZCBhcmVhcyBvZiB0aGUgdGVtcGxhdGUgYW5kIHN0aWxsIGFuaW1hdGVcbiAqIHRoZW0gaWYgbmVlZGVkLiBUaGlzIGlzIGFsc28gdGhlIGNhc2UgZm9yIHdoZW4gYSBzdWIgYW5pbWF0aW9uIGlzXG4gKiBxdWVyaWVkIGJ5IGEgcGFyZW50IGFuZCB0aGVuIGxhdGVyIGFuaW1hdGVkIHVzaW5nIGBhbmltYXRlQ2hpbGQoKWAuXG4gKlxuICogIyMjIERldGVjdGluZyB3aGVuIGFuIGFuaW1hdGlvbiBpcyBkaXNhYmxlZFxuICogSWYgYSByZWdpb24gb2YgdGhlIERPTSAob3IgdGhlIGVudGlyZSBhcHBsaWNhdGlvbikgaGFzIGl0cyBhbmltYXRpb25zIGRpc2FibGVkLCB0aGUgYW5pbWF0aW9uXG4gKiB0cmlnZ2VyIGNhbGxiYWNrcyBzdGlsbCBmaXJlLCBidXQgZm9yIHplcm8gc2Vjb25kcy4gV2hlbiB0aGUgY2FsbGJhY2sgZmlyZXMsIGl0IHByb3ZpZGVzXG4gKiBhbiBpbnN0YW5jZSBvZiBhbiBgQW5pbWF0aW9uRXZlbnRgLiBJZiBhbmltYXRpb25zIGFyZSBkaXNhYmxlZCxcbiAqIHRoZSBgLmRpc2FibGVkYCBmbGFnIG9uIHRoZSBldmVudCBpcyB0cnVlLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyaWdnZXIobmFtZTogc3RyaW5nLCBkZWZpbml0aW9uczogQW5pbWF0aW9uTWV0YWRhdGFbXSk6IEFuaW1hdGlvblRyaWdnZXJNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlRyaWdnZXIsIG5hbWUsIGRlZmluaXRpb25zLCBvcHRpb25zOiB7fX07XG59XG5cbi8qKlxuICogRGVmaW5lcyBhbiBhbmltYXRpb24gc3RlcCB0aGF0IGNvbWJpbmVzIHN0eWxpbmcgaW5mb3JtYXRpb24gd2l0aCB0aW1pbmcgaW5mb3JtYXRpb24uXG4gKlxuICogQHBhcmFtIHRpbWluZ3MgU2V0cyBgQW5pbWF0ZVRpbWluZ3NgIGZvciB0aGUgcGFyZW50IGFuaW1hdGlvbi5cbiAqIEEgc3RyaW5nIGluIHRoZSBmb3JtYXQgXCJkdXJhdGlvbiBbZGVsYXldIFtlYXNpbmddXCIuXG4gKiAgLSBEdXJhdGlvbiBhbmQgZGVsYXkgYXJlIGV4cHJlc3NlZCBhcyBhIG51bWJlciBhbmQgb3B0aW9uYWwgdGltZSB1bml0LFxuICogc3VjaCBhcyBcIjFzXCIgb3IgXCIxMG1zXCIgZm9yIG9uZSBzZWNvbmQgYW5kIDEwIG1pbGxpc2Vjb25kcywgcmVzcGVjdGl2ZWx5LlxuICogVGhlIGRlZmF1bHQgdW5pdCBpcyBtaWxsaXNlY29uZHMuXG4gKiAgLSBUaGUgZWFzaW5nIHZhbHVlIGNvbnRyb2xzIGhvdyB0aGUgYW5pbWF0aW9uIGFjY2VsZXJhdGVzIGFuZCBkZWNlbGVyYXRlc1xuICogZHVyaW5nIGl0cyBydW50aW1lLiBWYWx1ZSBpcyBvbmUgb2YgIGBlYXNlYCwgYGVhc2UtaW5gLCBgZWFzZS1vdXRgLFxuICogYGVhc2UtaW4tb3V0YCwgb3IgYSBgY3ViaWMtYmV6aWVyKClgIGZ1bmN0aW9uIGNhbGwuXG4gKiBJZiBub3Qgc3VwcGxpZWQsIG5vIGVhc2luZyBpcyBhcHBsaWVkLlxuICpcbiAqIEZvciBleGFtcGxlLCB0aGUgc3RyaW5nIFwiMXMgMTAwbXMgZWFzZS1vdXRcIiBzcGVjaWZpZXMgYSBkdXJhdGlvbiBvZlxuICogMTAwMCBtaWxsaXNlY29uZHMsIGFuZCBkZWxheSBvZiAxMDAgbXMsIGFuZCB0aGUgXCJlYXNlLW91dFwiIGVhc2luZyBzdHlsZSxcbiAqIHdoaWNoIGRlY2VsZXJhdGVzIG5lYXIgdGhlIGVuZCBvZiB0aGUgZHVyYXRpb24uXG4gKiBAcGFyYW0gc3R5bGVzIFNldHMgQW5pbWF0aW9uU3R5bGVzIGZvciB0aGUgcGFyZW50IGFuaW1hdGlvbi5cbiAqIEEgZnVuY3Rpb24gY2FsbCB0byBlaXRoZXIgYHN0eWxlKClgIG9yIGBrZXlmcmFtZXMoKWBcbiAqIHRoYXQgcmV0dXJucyBhIGNvbGxlY3Rpb24gb2YgQ1NTIHN0eWxlIGVudHJpZXMgdG8gYmUgYXBwbGllZCB0byB0aGUgcGFyZW50IGFuaW1hdGlvbi5cbiAqIFdoZW4gbnVsbCwgdXNlcyB0aGUgc3R5bGVzIGZyb20gdGhlIGRlc3RpbmF0aW9uIHN0YXRlLlxuICogVGhpcyBpcyB1c2VmdWwgd2hlbiBkZXNjcmliaW5nIGFuIGFuaW1hdGlvbiBzdGVwIHRoYXQgd2lsbCBjb21wbGV0ZSBhbiBhbmltYXRpb247XG4gKiBzZWUgXCJBbmltYXRpbmcgdG8gdGhlIGZpbmFsIHN0YXRlXCIgaW4gYHRyYW5zaXRpb25zKClgLlxuICogQHJldHVybnMgQW4gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBhbmltYXRpb24gc3RlcC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogQ2FsbCB3aXRoaW4gYW4gYW5pbWF0aW9uIGBzZXF1ZW5jZSgpYCwgYHtAbGluayBhbmltYXRpb25zL2dyb3VwIGdyb3VwKCl9YCwgb3JcbiAqIGB0cmFuc2l0aW9uKClgIGNhbGwgdG8gc3BlY2lmeSBhbiBhbmltYXRpb24gc3RlcFxuICogdGhhdCBhcHBsaWVzIGdpdmVuIHN0eWxlIGRhdGEgdG8gdGhlIHBhcmVudCBhbmltYXRpb24gZm9yIGEgZ2l2ZW4gYW1vdW50IG9mIHRpbWUuXG4gKlxuICogIyMjIFN5bnRheCBFeGFtcGxlc1xuICogKipUaW1pbmcgZXhhbXBsZXMqKlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZXMgc2hvdyB2YXJpb3VzIGB0aW1pbmdzYCBzcGVjaWZpY2F0aW9ucy5cbiAqIC0gYGFuaW1hdGUoNTAwKWAgOiBEdXJhdGlvbiBpcyA1MDAgbWlsbGlzZWNvbmRzLlxuICogLSBgYW5pbWF0ZShcIjFzXCIpYCA6IER1cmF0aW9uIGlzIDEwMDAgbWlsbGlzZWNvbmRzLlxuICogLSBgYW5pbWF0ZShcIjEwMG1zIDAuNXNcIilgIDogRHVyYXRpb24gaXMgMTAwIG1pbGxpc2Vjb25kcywgZGVsYXkgaXMgNTAwIG1pbGxpc2Vjb25kcy5cbiAqIC0gYGFuaW1hdGUoXCI1cyBlYXNlLWluXCIpYCA6IER1cmF0aW9uIGlzIDUwMDAgbWlsbGlzZWNvbmRzLCBlYXNpbmcgaW4uXG4gKiAtIGBhbmltYXRlKFwiNXMgMTBtcyBjdWJpYy1iZXppZXIoLjE3LC42NywuODgsLjEpXCIpYCA6IER1cmF0aW9uIGlzIDUwMDAgbWlsbGlzZWNvbmRzLCBkZWxheSBpcyAxMFxuICogbWlsbGlzZWNvbmRzLCBlYXNpbmcgYWNjb3JkaW5nIHRvIGEgYmV6aWVyIGN1cnZlLlxuICpcbiAqICoqU3R5bGUgZXhhbXBsZXMqKlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjYWxscyBgc3R5bGUoKWAgdG8gc2V0IGEgc2luZ2xlIENTUyBzdHlsZS5cbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGFuaW1hdGUoNTAwLCBzdHlsZSh7IGJhY2tncm91bmQ6IFwicmVkXCIgfSkpXG4gKiBgYGBcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBjYWxscyBga2V5ZnJhbWVzKClgIHRvIHNldCBhIENTUyBzdHlsZVxuICogdG8gZGlmZmVyZW50IHZhbHVlcyBmb3Igc3VjY2Vzc2l2ZSBrZXlmcmFtZXMuXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBhbmltYXRlKDUwMCwga2V5ZnJhbWVzKFxuICogIFtcbiAqICAgc3R5bGUoeyBiYWNrZ3JvdW5kOiBcImJsdWVcIiB9KSksXG4gKiAgIHN0eWxlKHsgYmFja2dyb3VuZDogXCJyZWRcIiB9KSlcbiAqICBdKVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gYW5pbWF0ZShcbiAgICB0aW1pbmdzOiBzdHJpbmcgfCBudW1iZXIsIHN0eWxlczogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YSB8IEFuaW1hdGlvbktleWZyYW1lc1NlcXVlbmNlTWV0YWRhdGEgfFxuICAgICAgICBudWxsID0gbnVsbCk6IEFuaW1hdGlvbkFuaW1hdGVNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGUsIHN0eWxlcywgdGltaW5nc307XG59XG5cbi8qKlxuICogQGRlc2NyaXB0aW9uIERlZmluZXMgYSBsaXN0IG9mIGFuaW1hdGlvbiBzdGVwcyB0byBiZSBydW4gaW4gcGFyYWxsZWwuXG4gKlxuICogQHBhcmFtIHN0ZXBzIEFuIGFycmF5IG9mIGFuaW1hdGlvbiBzdGVwIG9iamVjdHMuXG4gKiAtIFdoZW4gc3RlcHMgYXJlIGRlZmluZWQgYnkgYHN0eWxlKClgIG9yIGBhbmltYXRlKClgXG4gKiBmdW5jdGlvbiBjYWxscywgZWFjaCBjYWxsIHdpdGhpbiB0aGUgZ3JvdXAgaXMgZXhlY3V0ZWQgaW5zdGFudGx5LlxuICogLSBUbyBzcGVjaWZ5IG9mZnNldCBzdHlsZXMgdG8gYmUgYXBwbGllZCBhdCBhIGxhdGVyIHRpbWUsIGRlZmluZSBzdGVwcyB3aXRoXG4gKiBga2V5ZnJhbWVzKClgLCBvciB1c2UgYGFuaW1hdGUoKWAgY2FsbHMgd2l0aCBhIGRlbGF5IHZhbHVlLlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogZ3JvdXAoW1xuICogICBhbmltYXRlKFwiMXNcIiwgeyBiYWNrZ3JvdW5kOiBcImJsYWNrXCIgfSkpXG4gKiAgIGFuaW1hdGUoXCIyc1wiLCB7IGNvbG9yOiBcIndoaXRlXCIgfSkpXG4gKiBdKVxuICogYGBgXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgQW4gb3B0aW9ucyBvYmplY3QgY29udGFpbmluZyBhIGRlbGF5IGFuZFxuICogZGV2ZWxvcGVyLWRlZmluZWQgcGFyYW1ldGVycyB0aGF0IHByb3ZpZGUgc3R5bGluZyBkZWZhdWx0cyBhbmRcbiAqIGNhbiBiZSBvdmVycmlkZGVuIG9uIGludm9jYXRpb24uXG4gKlxuICogQHJldHVybiBBbiBvYmplY3QgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIGdyb3VwIGRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIEdyb3VwZWQgYW5pbWF0aW9ucyBhcmUgdXNlZnVsIHdoZW4gYSBzZXJpZXMgb2Ygc3R5bGVzIG11c3QgYmVcbiAqIGFuaW1hdGVkIGF0IGRpZmZlcmVudCBzdGFydGluZyB0aW1lcyBhbmQgY2xvc2VkIG9mZiBhdCBkaWZmZXJlbnQgZW5kaW5nIHRpbWVzLlxuICpcbiAqIFdoZW4gY2FsbGVkIHdpdGhpbiBhIGBzZXF1ZW5jZSgpYCBvciBhXG4gKiBgdHJhbnNpdGlvbigpYCBjYWxsLCBkb2VzIG5vdCBjb250aW51ZSB0byB0aGUgbmV4dFxuICogaW5zdHJ1Y3Rpb24gdW50aWwgYWxsIG9mIHRoZSBpbm5lciBhbmltYXRpb24gc3RlcHMgaGF2ZSBjb21wbGV0ZWQuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3JvdXAoXG4gICAgc3RlcHM6IEFuaW1hdGlvbk1ldGFkYXRhW10sIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMgfCBudWxsID0gbnVsbCk6IEFuaW1hdGlvbkdyb3VwTWV0YWRhdGEge1xuICByZXR1cm4ge3R5cGU6IEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5Hcm91cCwgc3RlcHMsIG9wdGlvbnN9O1xufVxuXG4vKipcbiAqIERlZmluZXMgYSBsaXN0IG9mIGFuaW1hdGlvbiBzdGVwcyB0byBiZSBydW4gc2VxdWVudGlhbGx5LCBvbmUgYnkgb25lLlxuICpcbiAqIEBwYXJhbSBzdGVwcyBBbiBhcnJheSBvZiBhbmltYXRpb24gc3RlcCBvYmplY3RzLlxuICogLSBTdGVwcyBkZWZpbmVkIGJ5IGBzdHlsZSgpYCBjYWxscyBhcHBseSB0aGUgc3R5bGluZyBkYXRhIGltbWVkaWF0ZWx5LlxuICogLSBTdGVwcyBkZWZpbmVkIGJ5IGBhbmltYXRlKClgIGNhbGxzIGFwcGx5IHRoZSBzdHlsaW5nIGRhdGEgb3ZlciB0aW1lXG4gKiAgIGFzIHNwZWNpZmllZCBieSB0aGUgdGltaW5nIGRhdGEuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogc2VxdWVuY2UoW1xuICogICBzdHlsZSh7IG9wYWNpdHk6IDAgfSkpLFxuICogICBhbmltYXRlKFwiMXNcIiwgeyBvcGFjaXR5OiAxIH0pKVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9wdGlvbnMgb2JqZWN0IGNvbnRhaW5pbmcgYSBkZWxheSBhbmRcbiAqIGRldmVsb3Blci1kZWZpbmVkIHBhcmFtZXRlcnMgdGhhdCBwcm92aWRlIHN0eWxpbmcgZGVmYXVsdHMgYW5kXG4gKiBjYW4gYmUgb3ZlcnJpZGRlbiBvbiBpbnZvY2F0aW9uLlxuICpcbiAqIEByZXR1cm4gQW4gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBzZXF1ZW5jZSBkYXRhLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBXaGVuIHlvdSBwYXNzIGFuIGFycmF5IG9mIHN0ZXBzIHRvIGFcbiAqIGB0cmFuc2l0aW9uKClgIGNhbGwsIHRoZSBzdGVwcyBydW4gc2VxdWVudGlhbGx5IGJ5IGRlZmF1bHQuXG4gKiBDb21wYXJlIHRoaXMgdG8gdGhlIGB7QGxpbmsgYW5pbWF0aW9ucy9ncm91cCBncm91cCgpfWAgY2FsbCwgd2hpY2ggcnVucyBhbmltYXRpb24gc3RlcHMgaW4gcGFyYWxsZWwuXG4gKlxuICogV2hlbiBhIHNlcXVlbmNlIGlzIHVzZWQgd2l0aGluIGEgYHtAbGluayBhbmltYXRpb25zL2dyb3VwIGdyb3VwKCl9YCBvciBhIGB0cmFuc2l0aW9uKClgIGNhbGwsXG4gKiBleGVjdXRpb24gY29udGludWVzIHRvIHRoZSBuZXh0IGluc3RydWN0aW9uIG9ubHkgYWZ0ZXIgZWFjaCBvZiB0aGUgaW5uZXIgYW5pbWF0aW9uXG4gKiBzdGVwcyBoYXZlIGNvbXBsZXRlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKiovXG5leHBvcnQgZnVuY3Rpb24gc2VxdWVuY2Uoc3RlcHM6IEFuaW1hdGlvbk1ldGFkYXRhW10sIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMgfCBudWxsID0gbnVsbCk6XG4gICAgQW5pbWF0aW9uU2VxdWVuY2VNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlNlcXVlbmNlLCBzdGVwcywgb3B0aW9uc307XG59XG5cbi8qKlxuICogRGVjbGFyZXMgYSBrZXkvdmFsdWUgb2JqZWN0IGNvbnRhaW5pbmcgQ1NTIHByb3BlcnRpZXMvc3R5bGVzIHRoYXRcbiAqIGNhbiB0aGVuIGJlIHVzZWQgZm9yIGFuIGFuaW1hdGlvbiBgc3RhdGVgLCB3aXRoaW4gYW4gYW5pbWF0aW9uIGBzZXF1ZW5jZWAsXG4gKiBvciBhcyBzdHlsaW5nIGRhdGEgZm9yIGNhbGxzIHRvIGBhbmltYXRlKClgIGFuZCBga2V5ZnJhbWVzKClgLlxuICpcbiAqIEBwYXJhbSB0b2tlbnMgQSBzZXQgb2YgQ1NTIHN0eWxlcyBvciBIVE1MIHN0eWxlcyBhc3NvY2lhdGVkIHdpdGggYW4gYW5pbWF0aW9uIHN0YXRlLlxuICogVGhlIHZhbHVlIGNhbiBiZSBhbnkgb2YgdGhlIGZvbGxvd2luZzpcbiAqIC0gQSBrZXktdmFsdWUgc3R5bGUgcGFpciBhc3NvY2lhdGluZyBhIENTUyBwcm9wZXJ0eSB3aXRoIGEgdmFsdWUuXG4gKiAtIEFuIGFycmF5IG9mIGtleS12YWx1ZSBzdHlsZSBwYWlycy5cbiAqIC0gQW4gYXN0ZXJpc2sgKCopLCB0byB1c2UgYXV0by1zdHlsaW5nLCB3aGVyZSBzdHlsZXMgYXJlIGRlcml2ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogYmVpbmcgYW5pbWF0ZWQgYW5kIGFwcGxpZWQgdG8gdGhlIGFuaW1hdGlvbiB3aGVuIGl0IHN0YXJ0cy5cbiAqXG4gKiBBdXRvLXN0eWxpbmcgY2FuIGJlIHVzZWQgdG8gZGVmaW5lIGEgc3RhdGUgdGhhdCBkZXBlbmRzIG9uIGxheW91dCBvciBvdGhlclxuICogZW52aXJvbm1lbnRhbCBmYWN0b3JzLlxuICpcbiAqIEByZXR1cm4gQW4gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBzdHlsZSBkYXRhLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBUaGUgZm9sbG93aW5nIGV4YW1wbGVzIGNyZWF0ZSBhbmltYXRpb24gc3R5bGVzIHRoYXQgY29sbGVjdCBhIHNldCBvZlxuICogQ1NTIHByb3BlcnR5IHZhbHVlczpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBzdHJpbmcgdmFsdWVzIGZvciBDU1MgcHJvcGVydGllc1xuICogc3R5bGUoeyBiYWNrZ3JvdW5kOiBcInJlZFwiLCBjb2xvcjogXCJibHVlXCIgfSlcbiAqXG4gKiAvLyBudW1lcmljYWwgcGl4ZWwgdmFsdWVzXG4gKiBzdHlsZSh7IHdpZHRoOiAxMDAsIGhlaWdodDogMCB9KVxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyBleGFtcGxlIHVzZXMgYXV0by1zdHlsaW5nIHRvIGFsbG93IGEgY29tcG9uZW50IHRvIGFuaW1hdGUgZnJvbVxuICogYSBoZWlnaHQgb2YgMCB1cCB0byB0aGUgaGVpZ2h0IG9mIHRoZSBwYXJlbnQgZWxlbWVudDpcbiAqXG4gKiBgYGBcbiAqIHN0eWxlKHsgaGVpZ2h0OiAwIH0pLFxuICogYW5pbWF0ZShcIjFzXCIsIHN0eWxlKHsgaGVpZ2h0OiBcIipcIiB9KSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHlsZShcbiAgICB0b2tlbnM6ICcqJyB8IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9IHxcbiAgICBBcnJheTwnKid8e1trZXk6IHN0cmluZ106IHN0cmluZyB8IG51bWJlcn0+KTogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0eWxlLCBzdHlsZXM6IHRva2Vucywgb2Zmc2V0OiBudWxsfTtcbn1cblxuLyoqXG4gKiBEZWNsYXJlcyBhbiBhbmltYXRpb24gc3RhdGUgd2l0aGluIGEgdHJpZ2dlciBhdHRhY2hlZCB0byBhbiBlbGVtZW50LlxuICpcbiAqIEBwYXJhbSBuYW1lIE9uZSBvciBtb3JlIG5hbWVzIGZvciB0aGUgZGVmaW5lZCBzdGF0ZSBpbiBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmcuXG4gKiBUaGUgZm9sbG93aW5nIHJlc2VydmVkIHN0YXRlIG5hbWVzIGNhbiBiZSBzdXBwbGllZCB0byBkZWZpbmUgYSBzdHlsZSBmb3Igc3BlY2lmaWMgdXNlXG4gKiBjYXNlczpcbiAqXG4gKiAtIGB2b2lkYCBZb3UgY2FuIGFzc29jaWF0ZSBzdHlsZXMgd2l0aCB0aGlzIG5hbWUgdG8gYmUgdXNlZCB3aGVuXG4gKiB0aGUgZWxlbWVudCBpcyBkZXRhY2hlZCBmcm9tIHRoZSBhcHBsaWNhdGlvbi4gRm9yIGV4YW1wbGUsIHdoZW4gYW4gYG5nSWZgIGV2YWx1YXRlc1xuICogdG8gZmFsc2UsIHRoZSBzdGF0ZSBvZiB0aGUgYXNzb2NpYXRlZCBlbGVtZW50IGlzIHZvaWQuXG4gKiAgLSBgKmAgKGFzdGVyaXNrKSBJbmRpY2F0ZXMgdGhlIGRlZmF1bHQgc3RhdGUuIFlvdSBjYW4gYXNzb2NpYXRlIHN0eWxlcyB3aXRoIHRoaXMgbmFtZVxuICogdG8gYmUgdXNlZCBhcyB0aGUgZmFsbGJhY2sgd2hlbiB0aGUgc3RhdGUgdGhhdCBpcyBiZWluZyBhbmltYXRlZCBpcyBub3QgZGVjbGFyZWRcbiAqIHdpdGhpbiB0aGUgdHJpZ2dlci5cbiAqXG4gKiBAcGFyYW0gc3R5bGVzIEEgc2V0IG9mIENTUyBzdHlsZXMgYXNzb2NpYXRlZCB3aXRoIHRoaXMgc3RhdGUsIGNyZWF0ZWQgdXNpbmcgdGhlXG4gKiBgc3R5bGUoKWAgZnVuY3Rpb24uXG4gKiBUaGlzIHNldCBvZiBzdHlsZXMgcGVyc2lzdHMgb24gdGhlIGVsZW1lbnQgb25jZSB0aGUgc3RhdGUgaGFzIGJlZW4gcmVhY2hlZC5cbiAqIEBwYXJhbSBvcHRpb25zIFBhcmFtZXRlcnMgdGhhdCBjYW4gYmUgcGFzc2VkIHRvIHRoZSBzdGF0ZSB3aGVuIGl0IGlzIGludm9rZWQuXG4gKiAwIG9yIG1vcmUga2V5LXZhbHVlIHBhaXJzLlxuICogQHJldHVybiBBbiBvYmplY3QgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIG5ldyBzdGF0ZSBkYXRhLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBVc2UgdGhlIGB0cmlnZ2VyKClgIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHN0YXRlcyB0byBhbiBhbmltYXRpb24gdHJpZ2dlci5cbiAqIFVzZSB0aGUgYHRyYW5zaXRpb24oKWAgZnVuY3Rpb24gdG8gYW5pbWF0ZSBiZXR3ZWVuIHN0YXRlcy5cbiAqIFdoZW4gYSBzdGF0ZSBpcyBhY3RpdmUgd2l0aGluIGEgY29tcG9uZW50LCBpdHMgYXNzb2NpYXRlZCBzdHlsZXMgcGVyc2lzdCBvbiB0aGUgZWxlbWVudCxcbiAqIGV2ZW4gd2hlbiB0aGUgYW5pbWF0aW9uIGVuZHMuXG4gKlxuICogQHB1YmxpY0FwaVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXRlKFxuICAgIG5hbWU6IHN0cmluZywgc3R5bGVzOiBBbmltYXRpb25TdHlsZU1ldGFkYXRhLFxuICAgIG9wdGlvbnM/OiB7cGFyYW1zOiB7W25hbWU6IHN0cmluZ106IGFueX19KTogQW5pbWF0aW9uU3RhdGVNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0YXRlLCBuYW1lLCBzdHlsZXMsIG9wdGlvbnN9O1xufVxuXG4vKipcbiAqIERlZmluZXMgYSBzZXQgb2YgYW5pbWF0aW9uIHN0eWxlcywgYXNzb2NpYXRpbmcgZWFjaCBzdHlsZSB3aXRoIGFuIG9wdGlvbmFsIGBvZmZzZXRgIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBzdGVwcyBBIHNldCBvZiBhbmltYXRpb24gc3R5bGVzIHdpdGggb3B0aW9uYWwgb2Zmc2V0IGRhdGEuXG4gKiBUaGUgb3B0aW9uYWwgYG9mZnNldGAgdmFsdWUgZm9yIGEgc3R5bGUgc3BlY2lmaWVzIGEgcGVyY2VudGFnZSBvZiB0aGUgdG90YWwgYW5pbWF0aW9uXG4gKiB0aW1lIGF0IHdoaWNoIHRoYXQgc3R5bGUgaXMgYXBwbGllZC5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUga2V5ZnJhbWVzIGRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFVzZSB3aXRoIHRoZSBgYW5pbWF0ZSgpYCBjYWxsLiBJbnN0ZWFkIG9mIGFwcGx5aW5nIGFuaW1hdGlvbnNcbiAqIGZyb20gdGhlIGN1cnJlbnQgc3RhdGVcbiAqIHRvIHRoZSBkZXN0aW5hdGlvbiBzdGF0ZSwga2V5ZnJhbWVzIGRlc2NyaWJlIGhvdyBlYWNoIHN0eWxlIGVudHJ5IGlzIGFwcGxpZWQgYW5kIGF0IHdoYXQgcG9pbnRcbiAqIHdpdGhpbiB0aGUgYW5pbWF0aW9uIGFyYy5cbiAqIENvbXBhcmUgW0NTUyBLZXlmcmFtZSBBbmltYXRpb25zXShodHRwczovL3d3dy53M3NjaG9vbHMuY29tL2Nzcy9jc3MzX2FuaW1hdGlvbnMuYXNwKS5cbiAqXG4gKiAjIyMgVXNhZ2VcbiAqXG4gKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIHRoZSBvZmZzZXQgdmFsdWVzIGRlc2NyaWJlXG4gKiB3aGVuIGVhY2ggYGJhY2tncm91bmRDb2xvcmAgdmFsdWUgaXMgYXBwbGllZC4gVGhlIGNvbG9yIGlzIHJlZCBhdCB0aGUgc3RhcnQsIGFuZCBjaGFuZ2VzIHRvXG4gKiBibHVlIHdoZW4gMjAlIG9mIHRoZSB0b3RhbCB0aW1lIGhhcyBlbGFwc2VkLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIHRoZSBwcm92aWRlZCBvZmZzZXQgdmFsdWVzXG4gKiBhbmltYXRlKFwiNXNcIiwga2V5ZnJhbWVzKFtcbiAqICAgc3R5bGUoeyBiYWNrZ3JvdW5kQ29sb3I6IFwicmVkXCIsIG9mZnNldDogMCB9KSxcbiAqICAgc3R5bGUoeyBiYWNrZ3JvdW5kQ29sb3I6IFwiYmx1ZVwiLCBvZmZzZXQ6IDAuMiB9KSxcbiAqICAgc3R5bGUoeyBiYWNrZ3JvdW5kQ29sb3I6IFwib3JhbmdlXCIsIG9mZnNldDogMC4zIH0pLFxuICogICBzdHlsZSh7IGJhY2tncm91bmRDb2xvcjogXCJibGFja1wiLCBvZmZzZXQ6IDEgfSlcbiAqIF0pKVxuICogYGBgXG4gKlxuICogSWYgdGhlcmUgYXJlIG5vIGBvZmZzZXRgIHZhbHVlcyBzcGVjaWZpZWQgaW4gdGhlIHN0eWxlIGVudHJpZXMsIHRoZSBvZmZzZXRzXG4gKiBhcmUgY2FsY3VsYXRlZCBhdXRvbWF0aWNhbGx5LlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIGFuaW1hdGUoXCI1c1wiLCBrZXlmcmFtZXMoW1xuICogICBzdHlsZSh7IGJhY2tncm91bmRDb2xvcjogXCJyZWRcIiB9KSAvLyBvZmZzZXQgPSAwXG4gKiAgIHN0eWxlKHsgYmFja2dyb3VuZENvbG9yOiBcImJsdWVcIiB9KSAvLyBvZmZzZXQgPSAwLjMzXG4gKiAgIHN0eWxlKHsgYmFja2dyb3VuZENvbG9yOiBcIm9yYW5nZVwiIH0pIC8vIG9mZnNldCA9IDAuNjZcbiAqICAgc3R5bGUoeyBiYWNrZ3JvdW5kQ29sb3I6IFwiYmxhY2tcIiB9KSAvLyBvZmZzZXQgPSAxXG4gKiBdKSlcbiAqYGBgXG5cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGtleWZyYW1lcyhzdGVwczogQW5pbWF0aW9uU3R5bGVNZXRhZGF0YVtdKTogQW5pbWF0aW9uS2V5ZnJhbWVzU2VxdWVuY2VNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLktleWZyYW1lcywgc3RlcHN9O1xufVxuXG4vKipcbiAqIERlY2xhcmVzIGFuIGFuaW1hdGlvbiB0cmFuc2l0aW9uIGFzIGEgc2VxdWVuY2Ugb2YgYW5pbWF0aW9uIHN0ZXBzIHRvIHJ1biB3aGVuIGEgZ2l2ZW5cbiAqIGNvbmRpdGlvbiBpcyBzYXRpc2ZpZWQuIFRoZSBjb25kaXRpb24gaXMgYSBCb29sZWFuIGV4cHJlc3Npb24gb3IgZnVuY3Rpb24gdGhhdCBjb21wYXJlc1xuICogdGhlIHByZXZpb3VzIGFuZCBjdXJyZW50IGFuaW1hdGlvbiBzdGF0ZXMsIGFuZCByZXR1cm5zIHRydWUgaWYgdGhpcyB0cmFuc2l0aW9uIHNob3VsZCBvY2N1ci5cbiAqIFdoZW4gdGhlIHN0YXRlIGNyaXRlcmlhIG9mIGEgZGVmaW5lZCB0cmFuc2l0aW9uIGFyZSBtZXQsIHRoZSBhc3NvY2lhdGVkIGFuaW1hdGlvbiBpc1xuICogdHJpZ2dlcmVkLlxuICpcbiAqIEBwYXJhbSBzdGF0ZUNoYW5nZUV4cHIgQSBCb29sZWFuIGV4cHJlc3Npb24gb3IgZnVuY3Rpb24gdGhhdCBjb21wYXJlcyB0aGUgcHJldmlvdXMgYW5kIGN1cnJlbnRcbiAqIGFuaW1hdGlvbiBzdGF0ZXMsIGFuZCByZXR1cm5zIHRydWUgaWYgdGhpcyB0cmFuc2l0aW9uIHNob3VsZCBvY2N1ci4gTm90ZSB0aGF0ICBcInRydWVcIiBhbmQgXCJmYWxzZVwiXG4gKiBtYXRjaCAxIGFuZCAwLCByZXNwZWN0aXZlbHkuIEFuIGV4cHJlc3Npb24gaXMgZXZhbHVhdGVkIGVhY2ggdGltZSBhIHN0YXRlIGNoYW5nZSBvY2N1cnMgaW4gdGhlXG4gKiBhbmltYXRpb24gdHJpZ2dlciBlbGVtZW50LlxuICogVGhlIGFuaW1hdGlvbiBzdGVwcyBydW4gd2hlbiB0aGUgZXhwcmVzc2lvbiBldmFsdWF0ZXMgdG8gdHJ1ZS5cbiAqXG4gKiAtIEEgc3RhdGUtY2hhbmdlIHN0cmluZyB0YWtlcyB0aGUgZm9ybSBcInN0YXRlMSA9PiBzdGF0ZTJcIiwgd2hlcmUgZWFjaCBzaWRlIGlzIGEgZGVmaW5lZCBhbmltYXRpb25cbiAqIHN0YXRlLCBvciBhbiBhc3Rlcml4ICgqKSB0byByZWZlciB0byBhIGR5bmFtaWMgc3RhcnQgb3IgZW5kIHN0YXRlLlxuICogICAtIFRoZSBleHByZXNzaW9uIHN0cmluZyBjYW4gY29udGFpbiBtdWx0aXBsZSBjb21tYS1zZXBhcmF0ZWQgc3RhdGVtZW50cztcbiAqIGZvciBleGFtcGxlIFwic3RhdGUxID0+IHN0YXRlMiwgc3RhdGUzID0+IHN0YXRlNFwiLlxuICogICAtIFNwZWNpYWwgdmFsdWVzIGA6ZW50ZXJgIGFuZCBgOmxlYXZlYCBpbml0aWF0ZSBhIHRyYW5zaXRpb24gb24gdGhlIGVudHJ5IGFuZCBleGl0IHN0YXRlcyxcbiAqIGVxdWl2YWxlbnQgdG8gIFwidm9pZCA9PiAqXCIgIGFuZCBcIiogPT4gdm9pZFwiLlxuICogICAtIFNwZWNpYWwgdmFsdWVzIGA6aW5jcmVtZW50YCBhbmQgYDpkZWNyZW1lbnRgIGluaXRpYXRlIGEgdHJhbnNpdGlvbiB3aGVuIGEgbnVtZXJpYyB2YWx1ZSBoYXNcbiAqIGluY3JlYXNlZCBvciBkZWNyZWFzZWQgaW4gdmFsdWUuXG4gKiAtIEEgZnVuY3Rpb24gaXMgZXhlY3V0ZWQgZWFjaCB0aW1lIGEgc3RhdGUgY2hhbmdlIG9jY3VycyBpbiB0aGUgYW5pbWF0aW9uIHRyaWdnZXIgZWxlbWVudC5cbiAqIFRoZSBhbmltYXRpb24gc3RlcHMgcnVuIHdoZW4gdGhlIGZ1bmN0aW9uIHJldHVybnMgdHJ1ZS5cbiAqXG4gKiBAcGFyYW0gc3RlcHMgT25lIG9yIG1vcmUgYW5pbWF0aW9uIG9iamVjdHMsIGFzIHJldHVybmVkIGJ5IHRoZSBgYW5pbWF0ZSgpYCBvclxuICogYHNlcXVlbmNlKClgIGZ1bmN0aW9uLCB0aGF0IGZvcm0gYSB0cmFuc2Zvcm1hdGlvbiBmcm9tIG9uZSBzdGF0ZSB0byBhbm90aGVyLlxuICogQSBzZXF1ZW5jZSBpcyB1c2VkIGJ5IGRlZmF1bHQgd2hlbiB5b3UgcGFzcyBhbiBhcnJheS5cbiAqIEBwYXJhbSBvcHRpb25zIEFuIG9wdGlvbnMgb2JqZWN0IHRoYXQgY2FuIGNvbnRhaW4gYSBkZWxheSB2YWx1ZSBmb3IgdGhlIHN0YXJ0IG9mIHRoZSBhbmltYXRpb24sXG4gKiBhbmQgYWRkaXRpb25hbCBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzLiBQcm92aWRlZCB2YWx1ZXMgZm9yIGFkZGl0aW9uYWwgcGFyYW1ldGVycyBhcmUgdXNlZFxuICogYXMgZGVmYXVsdHMsIGFuZCBvdmVycmlkZSB2YWx1ZXMgY2FuIGJlIHBhc3NlZCB0byB0aGUgY2FsbGVyIG9uIGludm9jYXRpb24uXG4gKiBAcmV0dXJucyBBbiBvYmplY3QgdGhhdCBlbmNhcHN1bGF0ZXMgdGhlIHRyYW5zaXRpb24gZGF0YS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogVGhlIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCBhIGNvbXBvbmVudCBiaW5kcyBhbiBhbmltYXRpb24gdHJpZ2dlciB0byBhbiBlbGVtZW50LlxuICpcbiAqIGBgYEhUTUxcbiAqIDwhLS0gc29tZXdoZXJlIGluc2lkZSBvZiBteS1jb21wb25lbnQtdHBsLmh0bWwgLS0+XG4gKiA8ZGl2IFtAbXlBbmltYXRpb25UcmlnZ2VyXT1cIm15U3RhdHVzRXhwXCI+Li4uPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBBbGwgdHJhbnNpdGlvbnMgYXJlIGRlZmluZWQgd2l0aGluIGFuIGFuaW1hdGlvbiB0cmlnZ2VyLFxuICogYWxvbmcgd2l0aCBuYW1lZCBzdGF0ZXMgdGhhdCB0aGUgdHJhbnNpdGlvbnMgY2hhbmdlIHRvIGFuZCBmcm9tLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHRyaWdnZXIoXCJteUFuaW1hdGlvblRyaWdnZXJcIiwgW1xuICogIC8vIGRlZmluZSBzdGF0ZXNcbiAqICBzdGF0ZShcIm9uXCIsIHN0eWxlKHsgYmFja2dyb3VuZDogXCJncmVlblwiIH0pKSxcbiAqICBzdGF0ZShcIm9mZlwiLCBzdHlsZSh7IGJhY2tncm91bmQ6IFwiZ3JleVwiIH0pKSxcbiAqICAuLi5dXG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgd2hlbiB5b3UgY2FsbCB0aGUgYHNlcXVlbmNlKClgIGZ1bmN0aW9uIHdpdGhpbiBhIGB7QGxpbmsgYW5pbWF0aW9ucy9ncm91cCBncm91cCgpfWBcbiAqIG9yIGEgYHRyYW5zaXRpb24oKWAgY2FsbCwgZXhlY3V0aW9uIGRvZXMgbm90IGNvbnRpbnVlIHRvIHRoZSBuZXh0IGluc3RydWN0aW9uXG4gKiB1bnRpbCBlYWNoIG9mIHRoZSBpbm5lciBhbmltYXRpb24gc3RlcHMgaGF2ZSBjb21wbGV0ZWQuXG4gKlxuICogIyMjIFN5bnRheCBleGFtcGxlc1xuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZXMgZGVmaW5lIHRyYW5zaXRpb25zIGJldHdlZW4gdGhlIHR3byBkZWZpbmVkIHN0YXRlcyAoYW5kIGRlZmF1bHQgc3RhdGVzKSxcbiAqIHVzaW5nIHZhcmlvdXMgb3B0aW9uczpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBUcmFuc2l0aW9uIG9jY3VycyB3aGVuIHRoZSBzdGF0ZSB2YWx1ZVxuICogLy8gYm91bmQgdG8gXCJteUFuaW1hdGlvblRyaWdnZXJcIiBjaGFuZ2VzIGZyb20gXCJvblwiIHRvIFwib2ZmXCJcbiAqIHRyYW5zaXRpb24oXCJvbiA9PiBvZmZcIiwgYW5pbWF0ZSg1MDApKVxuICogLy8gUnVuIHRoZSBzYW1lIGFuaW1hdGlvbiBmb3IgYm90aCBkaXJlY3Rpb25zXG4gKiB0cmFuc2l0aW9uKFwib24gPD0+IG9mZlwiLCBhbmltYXRlKDUwMCkpXG4gKiAvLyBEZWZpbmUgbXVsdGlwbGUgc3RhdGUtY2hhbmdlIHBhaXJzIHNlcGFyYXRlZCBieSBjb21tYXNcbiAqIHRyYW5zaXRpb24oXCJvbiA9PiBvZmYsIG9mZiA9PiB2b2lkXCIsIGFuaW1hdGUoNTAwKSlcbiAqIGBgYFxuICpcbiAqICMjIyBTcGVjaWFsIHZhbHVlcyBmb3Igc3RhdGUtY2hhbmdlIGV4cHJlc3Npb25zXG4gKlxuICogLSBDYXRjaC1hbGwgc3RhdGUgY2hhbmdlIGZvciB3aGVuIGFuIGVsZW1lbnQgaXMgaW5zZXJ0ZWQgaW50byB0aGUgcGFnZSBhbmQgdGhlXG4gKiBkZXN0aW5hdGlvbiBzdGF0ZSBpcyB1bmtub3duOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHRyYW5zaXRpb24oXCJ2b2lkID0+ICpcIiwgW1xuICogIHN0eWxlKHsgb3BhY2l0eTogMCB9KSxcbiAqICBhbmltYXRlKDUwMClcbiAqICBdKVxuICogYGBgXG4gKlxuICogLSBDYXB0dXJlIGEgc3RhdGUgY2hhbmdlIGJldHdlZW4gYW55IHN0YXRlczpcbiAqXG4gKiAgYHRyYW5zaXRpb24oXCIqID0+ICpcIiwgYW5pbWF0ZShcIjFzIDBzXCIpKWBcbiAqXG4gKiAtIEVudHJ5IGFuZCBleGl0IHRyYW5zaXRpb25zOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHRyYW5zaXRpb24oXCI6ZW50ZXJcIiwgW1xuICogICBzdHlsZSh7IG9wYWNpdHk6IDAgfSksXG4gKiAgIGFuaW1hdGUoNTAwLCBzdHlsZSh7IG9wYWNpdHk6IDEgfSkpXG4gKiAgIF0pLFxuICogdHJhbnNpdGlvbihcIjpsZWF2ZVwiLCBbXG4gKiAgIGFuaW1hdGUoNTAwLCBzdHlsZSh7IG9wYWNpdHk6IDAgfSkpXG4gKiAgIF0pXG4gKiBgYGBcbiAqXG4gKiAtIFVzZSBgOmluY3JlbWVudGAgYW5kIGA6ZGVjcmVtZW50YCB0byBpbml0aWF0ZSB0cmFuc2l0aW9uczpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0cmFuc2l0aW9uKFwiOmluY3JlbWVudFwiLCBncm91cChbXG4gKiAgcXVlcnkoJzplbnRlcicsIFtcbiAqICAgICBzdHlsZSh7IGxlZnQ6ICcxMDAlJyB9KSxcbiAqICAgICBhbmltYXRlKCcwLjVzIGVhc2Utb3V0Jywgc3R5bGUoJyonKSlcbiAqICAgXSksXG4gKiAgcXVlcnkoJzpsZWF2ZScsIFtcbiAqICAgICBhbmltYXRlKCcwLjVzIGVhc2Utb3V0Jywgc3R5bGUoeyBsZWZ0OiAnLTEwMCUnIH0pKVxuICogIF0pXG4gKiBdKSlcbiAqXG4gKiB0cmFuc2l0aW9uKFwiOmRlY3JlbWVudFwiLCBncm91cChbXG4gKiAgcXVlcnkoJzplbnRlcicsIFtcbiAqICAgICBzdHlsZSh7IGxlZnQ6ICcxMDAlJyB9KSxcbiAqICAgICBhbmltYXRlKCcwLjVzIGVhc2Utb3V0Jywgc3R5bGUoJyonKSlcbiAqICAgXSksXG4gKiAgcXVlcnkoJzpsZWF2ZScsIFtcbiAqICAgICBhbmltYXRlKCcwLjVzIGVhc2Utb3V0Jywgc3R5bGUoeyBsZWZ0OiAnLTEwMCUnIH0pKVxuICogIF0pXG4gKiBdKSlcbiAqIGBgYFxuICpcbiAqICMjIyBTdGF0ZS1jaGFuZ2UgZnVuY3Rpb25zXG4gKlxuICogSGVyZSBpcyBhbiBleGFtcGxlIG9mIGEgYGZyb21TdGF0ZWAgc3BlY2lmaWVkIGFzIGEgc3RhdGUtY2hhbmdlIGZ1bmN0aW9uIHRoYXQgaW52b2tlcyBhblxuICogYW5pbWF0aW9uIHdoZW4gdHJ1ZTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0cmFuc2l0aW9uKChmcm9tU3RhdGUsIHRvU3RhdGUpID0+XG4gKiAge1xuICogICByZXR1cm4gZnJvbVN0YXRlID09IFwib2ZmXCIgJiYgdG9TdGF0ZSA9PSBcIm9uXCI7XG4gKiAgfSxcbiAqICBhbmltYXRlKFwiMXMgMHNcIikpXG4gKiBgYGBcbiAqXG4gKiAjIyMgQW5pbWF0aW5nIHRvIHRoZSBmaW5hbCBzdGF0ZVxuICpcbiAqIElmIHRoZSBmaW5hbCBzdGVwIGluIGEgdHJhbnNpdGlvbiBpcyBhIGNhbGwgdG8gYGFuaW1hdGUoKWAgdGhhdCB1c2VzIGEgdGltaW5nIHZhbHVlXG4gKiB3aXRoIG5vIHN0eWxlIGRhdGEsIHRoYXQgc3RlcCBpcyBhdXRvbWF0aWNhbGx5IGNvbnNpZGVyZWQgdGhlIGZpbmFsIGFuaW1hdGlvbiBhcmMsXG4gKiBmb3IgdGhlIGVsZW1lbnQgdG8gcmVhY2ggdGhlIGZpbmFsIHN0YXRlLiBBbmd1bGFyIGF1dG9tYXRpY2FsbHkgYWRkcyBvciByZW1vdmVzXG4gKiBDU1Mgc3R5bGVzIHRvIGVuc3VyZSB0aGF0IHRoZSBlbGVtZW50IGlzIGluIHRoZSBjb3JyZWN0IGZpbmFsIHN0YXRlLlxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgdHJhbnNpdGlvbiB0aGF0IHN0YXJ0cyBieSBoaWRpbmcgdGhlIGVsZW1lbnQsXG4gKiB0aGVuIG1ha2VzIHN1cmUgdGhhdCBpdCBhbmltYXRlcyBwcm9wZXJseSB0byB3aGF0ZXZlciBzdGF0ZSBpcyBjdXJyZW50bHkgYWN0aXZlIGZvciB0cmlnZ2VyOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHRyYW5zaXRpb24oXCJ2b2lkID0+ICpcIiwgW1xuICogICBzdHlsZSh7IG9wYWNpdHk6IDAgfSksXG4gKiAgIGFuaW1hdGUoNTAwKVxuICogIF0pXG4gKiBgYGBcbiAqICMjIyBCb29sZWFuIHZhbHVlIG1hdGNoaW5nXG4gKiBJZiBhIHRyaWdnZXIgYmluZGluZyB2YWx1ZSBpcyBhIEJvb2xlYW4sIGl0IGNhbiBiZSBtYXRjaGVkIHVzaW5nIGEgdHJhbnNpdGlvbiBleHByZXNzaW9uXG4gKiB0aGF0IGNvbXBhcmVzIHRydWUgYW5kIGZhbHNlIG9yIDEgYW5kIDAuIEZvciBleGFtcGxlOlxuICpcbiAqIGBgYFxuICogLy8gaW4gdGhlIHRlbXBsYXRlXG4gKiA8ZGl2IFtAb3BlbkNsb3NlXT1cIm9wZW4gPyB0cnVlIDogZmFsc2VcIj4uLi48L2Rpdj5cbiAqIC8vIGluIHRoZSBjb21wb25lbnQgbWV0YWRhdGFcbiAqIHRyaWdnZXIoJ29wZW5DbG9zZScsIFtcbiAqICAgc3RhdGUoJ3RydWUnLCBzdHlsZSh7IGhlaWdodDogJyonIH0pKSxcbiAqICAgc3RhdGUoJ2ZhbHNlJywgc3R5bGUoeyBoZWlnaHQ6ICcwcHgnIH0pKSxcbiAqICAgdHJhbnNpdGlvbignZmFsc2UgPD0+IHRydWUnLCBhbmltYXRlKDUwMCkpXG4gKiBdKVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICoqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zaXRpb24oXG4gICAgc3RhdGVDaGFuZ2VFeHByOiBzdHJpbmcgfCAoKGZyb21TdGF0ZTogc3RyaW5nLCB0b1N0YXRlOiBzdHJpbmcsIGVsZW1lbnQ/OiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtcz86IHtba2V5OiBzdHJpbmddOiBhbnl9KSA9PiBib29sZWFuKSxcbiAgICBzdGVwczogQW5pbWF0aW9uTWV0YWRhdGEgfCBBbmltYXRpb25NZXRhZGF0YVtdLFxuICAgIG9wdGlvbnM6IEFuaW1hdGlvbk9wdGlvbnMgfCBudWxsID0gbnVsbCk6IEFuaW1hdGlvblRyYW5zaXRpb25NZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlRyYW5zaXRpb24sIGV4cHI6IHN0YXRlQ2hhbmdlRXhwciwgYW5pbWF0aW9uOiBzdGVwcywgb3B0aW9uc307XG59XG5cbi8qKlxuICogUHJvZHVjZXMgYSByZXVzYWJsZSBhbmltYXRpb24gdGhhdCBjYW4gYmUgaW52b2tlZCBpbiBhbm90aGVyIGFuaW1hdGlvbiBvciBzZXF1ZW5jZSxcbiAqIGJ5IGNhbGxpbmcgdGhlIGB1c2VBbmltYXRpb24oKWAgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHN0ZXBzIE9uZSBvciBtb3JlIGFuaW1hdGlvbiBvYmplY3RzLCBhcyByZXR1cm5lZCBieSB0aGUgYGFuaW1hdGUoKWBcbiAqIG9yIGBzZXF1ZW5jZSgpYCBmdW5jdGlvbiwgdGhhdCBmb3JtIGEgdHJhbnNmb3JtYXRpb24gZnJvbSBvbmUgc3RhdGUgdG8gYW5vdGhlci5cbiAqIEEgc2VxdWVuY2UgaXMgdXNlZCBieSBkZWZhdWx0IHdoZW4geW91IHBhc3MgYW4gYXJyYXkuXG4gKiBAcGFyYW0gb3B0aW9ucyBBbiBvcHRpb25zIG9iamVjdCB0aGF0IGNhbiBjb250YWluIGEgZGVsYXkgdmFsdWUgZm9yIHRoZSBzdGFydCBvZiB0aGVcbiAqIGFuaW1hdGlvbiwgYW5kIGFkZGl0aW9uYWwgZGV2ZWxvcGVyLWRlZmluZWQgcGFyYW1ldGVycy5cbiAqIFByb3ZpZGVkIHZhbHVlcyBmb3IgYWRkaXRpb25hbCBwYXJhbWV0ZXJzIGFyZSB1c2VkIGFzIGRlZmF1bHRzLFxuICogYW5kIG92ZXJyaWRlIHZhbHVlcyBjYW4gYmUgcGFzc2VkIHRvIHRoZSBjYWxsZXIgb24gaW52b2NhdGlvbi5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgYW5pbWF0aW9uIGRhdGEuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBkZWZpbmVzIGEgcmV1c2FibGUgYW5pbWF0aW9uLCBwcm92aWRpbmcgc29tZSBkZWZhdWx0IHBhcmFtZXRlclxuICogdmFsdWVzLlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHZhciBmYWRlQW5pbWF0aW9uID0gYW5pbWF0aW9uKFtcbiAqICAgc3R5bGUoeyBvcGFjaXR5OiAne3sgc3RhcnQgfX0nIH0pLFxuICogICBhbmltYXRlKCd7eyB0aW1lIH19JyxcbiAqICAgc3R5bGUoeyBvcGFjaXR5OiAne3sgZW5kIH19J30pKVxuICogICBdLFxuICogICB7IHBhcmFtczogeyB0aW1lOiAnMTAwMG1zJywgc3RhcnQ6IDAsIGVuZDogMSB9fSk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIGludm9rZXMgdGhlIGRlZmluZWQgYW5pbWF0aW9uIHdpdGggYSBjYWxsIHRvIGB1c2VBbmltYXRpb24oKWAsXG4gKiBwYXNzaW5nIGluIG92ZXJyaWRlIHBhcmFtZXRlciB2YWx1ZXMuXG4gKlxuICogYGBganNcbiAqIHVzZUFuaW1hdGlvbihmYWRlQW5pbWF0aW9uLCB7XG4gKiAgIHBhcmFtczoge1xuICogICAgIHRpbWU6ICcycycsXG4gKiAgICAgc3RhcnQ6IDEsXG4gKiAgICAgZW5kOiAwXG4gKiAgIH1cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBJZiBhbnkgb2YgdGhlIHBhc3NlZC1pbiBwYXJhbWV0ZXIgdmFsdWVzIGFyZSBtaXNzaW5nIGZyb20gdGhpcyBjYWxsLFxuICogdGhlIGRlZmF1bHQgdmFsdWVzIGFyZSB1c2VkLiBJZiBvbmUgb3IgbW9yZSBwYXJhbWV0ZXIgdmFsdWVzIGFyZSBtaXNzaW5nIGJlZm9yZSBhIHN0ZXAgaXNcbiAqIGFuaW1hdGVkLCBgdXNlQW5pbWF0aW9uKClgIHRocm93cyBhbiBlcnJvci5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmltYXRpb24oXG4gICAgc3RlcHM6IEFuaW1hdGlvbk1ldGFkYXRhIHwgQW5pbWF0aW9uTWV0YWRhdGFbXSxcbiAgICBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zIHwgbnVsbCA9IG51bGwpOiBBbmltYXRpb25SZWZlcmVuY2VNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlJlZmVyZW5jZSwgYW5pbWF0aW9uOiBzdGVwcywgb3B0aW9uc307XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBxdWVyaWVkIGlubmVyIGFuaW1hdGlvbiBlbGVtZW50IHdpdGhpbiBhbiBhbmltYXRpb24gc2VxdWVuY2UuXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgQW4gb3B0aW9ucyBvYmplY3QgdGhhdCBjYW4gY29udGFpbiBhIGRlbGF5IHZhbHVlIGZvciB0aGUgc3RhcnQgb2YgdGhlXG4gKiBhbmltYXRpb24sIGFuZCBhZGRpdGlvbmFsIG92ZXJyaWRlIHZhbHVlcyBmb3IgZGV2ZWxvcGVyLWRlZmluZWQgcGFyYW1ldGVycy5cbiAqIEByZXR1cm4gQW4gb2JqZWN0IHRoYXQgZW5jYXBzdWxhdGVzIHRoZSBjaGlsZCBhbmltYXRpb24gZGF0YS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogRWFjaCB0aW1lIGFuIGFuaW1hdGlvbiBpcyB0cmlnZ2VyZWQgaW4gQW5ndWxhciwgdGhlIHBhcmVudCBhbmltYXRpb25cbiAqIGhhcyBwcmlvcml0eSBhbmQgYW55IGNoaWxkIGFuaW1hdGlvbnMgYXJlIGJsb2NrZWQuIEluIG9yZGVyXG4gKiBmb3IgYSBjaGlsZCBhbmltYXRpb24gdG8gcnVuLCB0aGUgcGFyZW50IGFuaW1hdGlvbiBtdXN0IHF1ZXJ5IGVhY2ggb2YgdGhlIGVsZW1lbnRzXG4gKiBjb250YWluaW5nIGNoaWxkIGFuaW1hdGlvbnMsIGFuZCBydW4gdGhlbSB1c2luZyB0aGlzIGZ1bmN0aW9uLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGZlYXR1cmUgZGVzaWduZWQgdG8gYmUgdXNlZCB3aXRoIGBxdWVyeSgpYCBhbmQgaXQgd2lsbCBvbmx5IHdvcmtcbiAqIHdpdGggYW5pbWF0aW9ucyB0aGF0IGFyZSBhc3NpZ25lZCB1c2luZyB0aGUgQW5ndWxhciBhbmltYXRpb24gbGlicmFyeS4gQ1NTIGtleWZyYW1lc1xuICogYW5kIHRyYW5zaXRpb25zIGFyZSBub3QgaGFuZGxlZCBieSB0aGlzIEFQSS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbmltYXRlQ2hpbGQob3B0aW9uczogQW5pbWF0ZUNoaWxkT3B0aW9ucyB8IG51bGwgPSBudWxsKTpcbiAgICBBbmltYXRpb25BbmltYXRlQ2hpbGRNZXRhZGF0YSB7XG4gIHJldHVybiB7dHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGVDaGlsZCwgb3B0aW9uc307XG59XG5cbi8qKlxuICogU3RhcnRzIGEgcmV1c2FibGUgYW5pbWF0aW9uIHRoYXQgaXMgY3JlYXRlZCB1c2luZyB0aGUgYGFuaW1hdGlvbigpYCBmdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gYW5pbWF0aW9uIFRoZSByZXVzYWJsZSBhbmltYXRpb24gdG8gc3RhcnQuXG4gKiBAcGFyYW0gb3B0aW9ucyBBbiBvcHRpb25zIG9iamVjdCB0aGF0IGNhbiBjb250YWluIGEgZGVsYXkgdmFsdWUgZm9yIHRoZSBzdGFydCBvZlxuICogdGhlIGFuaW1hdGlvbiwgYW5kIGFkZGl0aW9uYWwgb3ZlcnJpZGUgdmFsdWVzIGZvciBkZXZlbG9wZXItZGVmaW5lZCBwYXJhbWV0ZXJzLlxuICogQHJldHVybiBBbiBvYmplY3QgdGhhdCBjb250YWlucyB0aGUgYW5pbWF0aW9uIHBhcmFtZXRlcnMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gdXNlQW5pbWF0aW9uKFxuICAgIGFuaW1hdGlvbjogQW5pbWF0aW9uUmVmZXJlbmNlTWV0YWRhdGEsXG4gICAgb3B0aW9uczogQW5pbWF0aW9uT3B0aW9ucyB8IG51bGwgPSBudWxsKTogQW5pbWF0aW9uQW5pbWF0ZVJlZk1ldGFkYXRhIHtcbiAgcmV0dXJuIHt0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuQW5pbWF0ZVJlZiwgYW5pbWF0aW9uLCBvcHRpb25zfTtcbn1cblxuLyoqXG4gKiBGaW5kcyBvbmUgb3IgbW9yZSBpbm5lciBlbGVtZW50cyB3aXRoaW4gdGhlIGN1cnJlbnQgZWxlbWVudCB0aGF0IGlzXG4gKiBiZWluZyBhbmltYXRlZCB3aXRoaW4gYSBzZXF1ZW5jZS4gVXNlIHdpdGggYGFuaW1hdGVDaGlsZCgpYC5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3IgVGhlIGVsZW1lbnQgdG8gcXVlcnksIG9yIGEgc2V0IG9mIGVsZW1lbnRzIHRoYXQgY29udGFpbiBBbmd1bGFyLXNwZWNpZmljXG4gKiBjaGFyYWN0ZXJpc3RpY3MsIHNwZWNpZmllZCB3aXRoIG9uZSBvciBtb3JlIG9mIHRoZSBmb2xsb3dpbmcgdG9rZW5zLlxuICogIC0gYHF1ZXJ5KFwiOmVudGVyXCIpYCBvciBgcXVlcnkoXCI6bGVhdmVcIilgIDogUXVlcnkgZm9yIG5ld2x5IGluc2VydGVkL3JlbW92ZWQgZWxlbWVudHMuXG4gKiAgLSBgcXVlcnkoXCI6YW5pbWF0aW5nXCIpYCA6IFF1ZXJ5IGFsbCBjdXJyZW50bHkgYW5pbWF0aW5nIGVsZW1lbnRzLlxuICogIC0gYHF1ZXJ5KFwiQHRyaWdnZXJOYW1lXCIpYCA6IFF1ZXJ5IGVsZW1lbnRzIHRoYXQgY29udGFpbiBhbiBhbmltYXRpb24gdHJpZ2dlci5cbiAqICAtIGBxdWVyeShcIkAqXCIpYCA6IFF1ZXJ5IGFsbCBlbGVtZW50cyB0aGF0IGNvbnRhaW4gYW4gYW5pbWF0aW9uIHRyaWdnZXJzLlxuICogIC0gYHF1ZXJ5KFwiOnNlbGZcIilgIDogSW5jbHVkZSB0aGUgY3VycmVudCBlbGVtZW50IGludG8gdGhlIGFuaW1hdGlvbiBzZXF1ZW5jZS5cbiAqXG4gKiBAcGFyYW0gYW5pbWF0aW9uIE9uZSBvciBtb3JlIGFuaW1hdGlvbiBzdGVwcyB0byBhcHBseSB0byB0aGUgcXVlcmllZCBlbGVtZW50IG9yIGVsZW1lbnRzLlxuICogQW4gYXJyYXkgaXMgdHJlYXRlZCBhcyBhbiBhbmltYXRpb24gc2VxdWVuY2UuXG4gKiBAcGFyYW0gb3B0aW9ucyBBbiBvcHRpb25zIG9iamVjdC4gVXNlIHRoZSAnbGltaXQnIGZpZWxkIHRvIGxpbWl0IHRoZSB0b3RhbCBudW1iZXIgb2ZcbiAqIGl0ZW1zIHRvIGNvbGxlY3QuXG4gKiBAcmV0dXJuIEFuIG9iamVjdCB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgcXVlcnkgZGF0YS5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogVG9rZW5zIGNhbiBiZSBtZXJnZWQgaW50byBhIGNvbWJpbmVkIHF1ZXJ5IHNlbGVjdG9yIHN0cmluZy4gRm9yIGV4YW1wbGU6XG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogIHF1ZXJ5KCc6c2VsZiwgLnJlY29yZDplbnRlciwgLnJlY29yZDpsZWF2ZSwgQHN1YlRyaWdnZXInLCBbLi4uXSlcbiAqIGBgYFxuICpcbiAqIFRoZSBgcXVlcnkoKWAgZnVuY3Rpb24gY29sbGVjdHMgbXVsdGlwbGUgZWxlbWVudHMgYW5kIHdvcmtzIGludGVybmFsbHkgYnkgdXNpbmdcbiAqIGBlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGxgLiBVc2UgdGhlIGBsaW1pdGAgZmllbGQgb2YgYW4gb3B0aW9ucyBvYmplY3QgdG8gbGltaXRcbiAqIHRoZSB0b3RhbCBudW1iZXIgb2YgaXRlbXMgdG8gYmUgY29sbGVjdGVkLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogcXVlcnkoJ2RpdicsIFtcbiAqICAgYW5pbWF0ZSguLi4pLFxuICogICBhbmltYXRlKC4uLilcbiAqIF0sIHsgbGltaXQ6IDEgfSlcbiAqIGBgYFxuICpcbiAqIEJ5IGRlZmF1bHQsIHRocm93cyBhbiBlcnJvciB3aGVuIHplcm8gaXRlbXMgYXJlIGZvdW5kLiBTZXQgdGhlXG4gKiBgb3B0aW9uYWxgIGZsYWcgdG8gaWdub3JlIHRoaXMgZXJyb3IuIEZvciBleGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBxdWVyeSgnLnNvbWUtZWxlbWVudC10aGF0LW1heS1ub3QtYmUtdGhlcmUnLCBbXG4gKiAgIGFuaW1hdGUoLi4uKSxcbiAqICAgYW5pbWF0ZSguLi4pXG4gKiBdLCB7IG9wdGlvbmFsOiB0cnVlIH0pXG4gKiBgYGBcbiAqXG4gKiAjIyMgVXNhZ2UgRXhhbXBsZVxuICpcbiAqIFRoZSBmb2xsb3dpbmcgZXhhbXBsZSBxdWVyaWVzIGZvciBpbm5lciBlbGVtZW50cyBhbmQgYW5pbWF0ZXMgdGhlbVxuICogaW5kaXZpZHVhbGx5IHVzaW5nIGBhbmltYXRlQ2hpbGQoKWAuXG4gKlxuICogYGBgdHlwZXNjcmlwdFxuICogQENvbXBvbmVudCh7XG4gKiAgIHNlbGVjdG9yOiAnaW5uZXInLFxuICogICB0ZW1wbGF0ZTogYFxuICogICAgIDxkaXYgW0BxdWVyeUFuaW1hdGlvbl09XCJleHBcIj5cbiAqICAgICAgIDxoMT5UaXRsZTwvaDE+XG4gKiAgICAgICA8ZGl2IGNsYXNzPVwiY29udGVudFwiPlxuICogICAgICAgICBCbGFoIGJsYWggYmxhaFxuICogICAgICAgPC9kaXY+XG4gKiAgICAgPC9kaXY+XG4gKiAgIGAsXG4gKiAgIGFuaW1hdGlvbnM6IFtcbiAqICAgIHRyaWdnZXIoJ3F1ZXJ5QW5pbWF0aW9uJywgW1xuICogICAgICB0cmFuc2l0aW9uKCcqID0+IGdvQW5pbWF0ZScsIFtcbiAqICAgICAgICAvLyBoaWRlIHRoZSBpbm5lciBlbGVtZW50c1xuICogICAgICAgIHF1ZXJ5KCdoMScsIHN0eWxlKHsgb3BhY2l0eTogMCB9KSksXG4gKiAgICAgICAgcXVlcnkoJy5jb250ZW50Jywgc3R5bGUoeyBvcGFjaXR5OiAwIH0pKSxcbiAqXG4gKiAgICAgICAgLy8gYW5pbWF0ZSB0aGUgaW5uZXIgZWxlbWVudHMgaW4sIG9uZSBieSBvbmVcbiAqICAgICAgICBxdWVyeSgnaDEnLCBhbmltYXRlKDEwMDAsIHN0eWxlKHsgb3BhY2l0eTogMSB9KSksXG4gKiAgICAgICAgcXVlcnkoJy5jb250ZW50JywgYW5pbWF0ZSgxMDAwLCBzdHlsZSh7IG9wYWNpdHk6IDEgfSkpLFxuICogICAgICBdKVxuICogICAgXSlcbiAqICBdXG4gKiB9KVxuICogY2xhc3MgQ21wIHtcbiAqICAgZXhwID0gJyc7XG4gKlxuICogICBnb0FuaW1hdGUoKSB7XG4gKiAgICAgdGhpcy5leHAgPSAnZ29BbmltYXRlJztcbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVlcnkoXG4gICAgc2VsZWN0b3I6IHN0cmluZywgYW5pbWF0aW9uOiBBbmltYXRpb25NZXRhZGF0YSB8IEFuaW1hdGlvbk1ldGFkYXRhW10sXG4gICAgb3B0aW9uczogQW5pbWF0aW9uUXVlcnlPcHRpb25zIHwgbnVsbCA9IG51bGwpOiBBbmltYXRpb25RdWVyeU1ldGFkYXRhIHtcbiAgcmV0dXJuIHt0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuUXVlcnksIHNlbGVjdG9yLCBhbmltYXRpb24sIG9wdGlvbnN9O1xufVxuXG4vKipcbiAqIFVzZSB3aXRoaW4gYW4gYW5pbWF0aW9uIGBxdWVyeSgpYCBjYWxsIHRvIGlzc3VlIGEgdGltaW5nIGdhcCBhZnRlclxuICogZWFjaCBxdWVyaWVkIGl0ZW0gaXMgYW5pbWF0ZWQuXG4gKlxuICogQHBhcmFtIHRpbWluZ3MgQSBkZWxheSB2YWx1ZS5cbiAqIEBwYXJhbSBhbmltYXRpb24gT25lIG9yZSBtb3JlIGFuaW1hdGlvbiBzdGVwcy5cbiAqIEByZXR1cm5zIEFuIG9iamVjdCB0aGF0IGVuY2Fwc3VsYXRlcyB0aGUgc3RhZ2dlciBkYXRhLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBJbiB0aGUgZm9sbG93aW5nIGV4YW1wbGUsIGEgY29udGFpbmVyIGVsZW1lbnQgd3JhcHMgYSBsaXN0IG9mIGl0ZW1zIHN0YW1wZWQgb3V0XG4gKiBieSBhbiBgbmdGb3JgLiBUaGUgY29udGFpbmVyIGVsZW1lbnQgY29udGFpbnMgYW4gYW5pbWF0aW9uIHRyaWdnZXIgdGhhdCB3aWxsIGxhdGVyIGJlIHNldFxuICogdG8gcXVlcnkgZm9yIGVhY2ggb2YgdGhlIGlubmVyIGl0ZW1zLlxuICpcbiAqIEVhY2ggdGltZSBpdGVtcyBhcmUgYWRkZWQsIHRoZSBvcGFjaXR5IGZhZGUtaW4gYW5pbWF0aW9uIHJ1bnMsXG4gKiBhbmQgZWFjaCByZW1vdmVkIGl0ZW0gaXMgZmFkZWQgb3V0LlxuICogV2hlbiBlaXRoZXIgb2YgdGhlc2UgYW5pbWF0aW9ucyBvY2N1ciwgdGhlIHN0YWdnZXIgZWZmZWN0IGlzXG4gKiBhcHBsaWVkIGFmdGVyIGVhY2ggaXRlbSdzIGFuaW1hdGlvbiBpcyBzdGFydGVkLlxuICpcbiAqIGBgYGh0bWxcbiAqIDwhLS0gbGlzdC5jb21wb25lbnQuaHRtbCAtLT5cbiAqIDxidXR0b24gKGNsaWNrKT1cInRvZ2dsZSgpXCI+U2hvdyAvIEhpZGUgSXRlbXM8L2J1dHRvbj5cbiAqIDxociAvPlxuICogPGRpdiBbQGxpc3RBbmltYXRpb25dPVwiaXRlbXMubGVuZ3RoXCI+XG4gKiAgIDxkaXYgKm5nRm9yPVwibGV0IGl0ZW0gb2YgaXRlbXNcIj5cbiAqICAgICB7eyBpdGVtIH19XG4gKiAgIDwvZGl2PlxuICogPC9kaXY+XG4gKiBgYGBcbiAqXG4gKiBIZXJlIGlzIHRoZSBjb21wb25lbnQgY29kZTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBpbXBvcnQge3RyaWdnZXIsIHRyYW5zaXRpb24sIHN0eWxlLCBhbmltYXRlLCBxdWVyeSwgc3RhZ2dlcn0gZnJvbSAnQGFuZ3VsYXIvYW5pbWF0aW9ucyc7XG4gKiBAQ29tcG9uZW50KHtcbiAqICAgdGVtcGxhdGVVcmw6ICdsaXN0LmNvbXBvbmVudC5odG1sJyxcbiAqICAgYW5pbWF0aW9uczogW1xuICogICAgIHRyaWdnZXIoJ2xpc3RBbmltYXRpb24nLCBbXG4gKiAgICAgLi4uXG4gKiAgICAgXSlcbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIExpc3RDb21wb25lbnQge1xuICogICBpdGVtcyA9IFtdO1xuICpcbiAqICAgc2hvd0l0ZW1zKCkge1xuICogICAgIHRoaXMuaXRlbXMgPSBbMCwxLDIsMyw0XTtcbiAqICAgfVxuICpcbiAqICAgaGlkZUl0ZW1zKCkge1xuICogICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAqICAgfVxuICpcbiAqICAgdG9nZ2xlKCkge1xuICogICAgIHRoaXMuaXRlbXMubGVuZ3RoID8gdGhpcy5oaWRlSXRlbXMoKSA6IHRoaXMuc2hvd0l0ZW1zKCk7XG4gKiAgICB9XG4gKiAgfVxuICogYGBgXG4gKlxuICogSGVyZSBpcyB0aGUgYW5pbWF0aW9uIHRyaWdnZXIgY29kZTpcbiAqXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiB0cmlnZ2VyKCdsaXN0QW5pbWF0aW9uJywgW1xuICogICB0cmFuc2l0aW9uKCcqID0+IConLCBbIC8vIGVhY2ggdGltZSB0aGUgYmluZGluZyB2YWx1ZSBjaGFuZ2VzXG4gKiAgICAgcXVlcnkoJzpsZWF2ZScsIFtcbiAqICAgICAgIHN0YWdnZXIoMTAwLCBbXG4gKiAgICAgICAgIGFuaW1hdGUoJzAuNXMnLCBzdHlsZSh7IG9wYWNpdHk6IDAgfSkpXG4gKiAgICAgICBdKVxuICogICAgIF0pLFxuICogICAgIHF1ZXJ5KCc6ZW50ZXInLCBbXG4gKiAgICAgICBzdHlsZSh7IG9wYWNpdHk6IDAgfSksXG4gKiAgICAgICBzdGFnZ2VyKDEwMCwgW1xuICogICAgICAgICBhbmltYXRlKCcwLjVzJywgc3R5bGUoeyBvcGFjaXR5OiAxIH0pKVxuICogICAgICAgXSlcbiAqICAgICBdKVxuICogICBdKVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0YWdnZXIoXG4gICAgdGltaW5nczogc3RyaW5nIHwgbnVtYmVyLFxuICAgIGFuaW1hdGlvbjogQW5pbWF0aW9uTWV0YWRhdGEgfCBBbmltYXRpb25NZXRhZGF0YVtdKTogQW5pbWF0aW9uU3RhZ2dlck1ldGFkYXRhIHtcbiAgcmV0dXJuIHt0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuU3RhZ2dlciwgdGltaW5ncywgYW5pbWF0aW9ufTtcbn1cbiJdfQ==