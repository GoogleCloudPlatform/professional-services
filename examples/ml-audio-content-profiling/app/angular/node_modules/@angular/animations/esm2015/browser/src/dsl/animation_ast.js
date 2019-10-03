/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/** @type {?} */
const EMPTY_ANIMATION_OPTIONS = {};
/**
 * @record
 */
export function AstVisitor() { }
/** @type {?} */
AstVisitor.prototype.visitTrigger;
/** @type {?} */
AstVisitor.prototype.visitState;
/** @type {?} */
AstVisitor.prototype.visitTransition;
/** @type {?} */
AstVisitor.prototype.visitSequence;
/** @type {?} */
AstVisitor.prototype.visitGroup;
/** @type {?} */
AstVisitor.prototype.visitAnimate;
/** @type {?} */
AstVisitor.prototype.visitStyle;
/** @type {?} */
AstVisitor.prototype.visitKeyframes;
/** @type {?} */
AstVisitor.prototype.visitReference;
/** @type {?} */
AstVisitor.prototype.visitAnimateChild;
/** @type {?} */
AstVisitor.prototype.visitAnimateRef;
/** @type {?} */
AstVisitor.prototype.visitQuery;
/** @type {?} */
AstVisitor.prototype.visitStagger;
// unsupported: template constraints.
/**
 * @record
 * @template T
 */
export function Ast() { }
/** @type {?} */
Ast.prototype.type;
/** @type {?} */
Ast.prototype.options;
/**
 * @record
 */
export function TriggerAst() { }
/** @type {?} */
TriggerAst.prototype.type;
/** @type {?} */
TriggerAst.prototype.name;
/** @type {?} */
TriggerAst.prototype.states;
/** @type {?} */
TriggerAst.prototype.transitions;
/** @type {?} */
TriggerAst.prototype.queryCount;
/** @type {?} */
TriggerAst.prototype.depCount;
/**
 * @record
 */
export function StateAst() { }
/** @type {?} */
StateAst.prototype.type;
/** @type {?} */
StateAst.prototype.name;
/** @type {?} */
StateAst.prototype.style;
/**
 * @record
 */
export function TransitionAst() { }
/** @type {?} */
TransitionAst.prototype.matchers;
/** @type {?} */
TransitionAst.prototype.animation;
/** @type {?} */
TransitionAst.prototype.queryCount;
/** @type {?} */
TransitionAst.prototype.depCount;
/**
 * @record
 */
export function SequenceAst() { }
/** @type {?} */
SequenceAst.prototype.steps;
/**
 * @record
 */
export function GroupAst() { }
/** @type {?} */
GroupAst.prototype.steps;
/**
 * @record
 */
export function AnimateAst() { }
/** @type {?} */
AnimateAst.prototype.timings;
/** @type {?} */
AnimateAst.prototype.style;
/**
 * @record
 */
export function StyleAst() { }
/** @type {?} */
StyleAst.prototype.styles;
/** @type {?} */
StyleAst.prototype.easing;
/** @type {?} */
StyleAst.prototype.offset;
/** @type {?} */
StyleAst.prototype.containsDynamicStyles;
/** @type {?|undefined} */
StyleAst.prototype.isEmptyStep;
/**
 * @record
 */
export function KeyframesAst() { }
/** @type {?} */
KeyframesAst.prototype.styles;
/**
 * @record
 */
export function ReferenceAst() { }
/** @type {?} */
ReferenceAst.prototype.animation;
/**
 * @record
 */
export function AnimateChildAst() { }
/**
 * @record
 */
export function AnimateRefAst() { }
/** @type {?} */
AnimateRefAst.prototype.animation;
/**
 * @record
 */
export function QueryAst() { }
/** @type {?} */
QueryAst.prototype.selector;
/** @type {?} */
QueryAst.prototype.limit;
/** @type {?} */
QueryAst.prototype.optional;
/** @type {?} */
QueryAst.prototype.includeSelf;
/** @type {?} */
QueryAst.prototype.animation;
/** @type {?} */
QueryAst.prototype.originalSelector;
/**
 * @record
 */
export function StaggerAst() { }
/** @type {?} */
StaggerAst.prototype.timings;
/** @type {?} */
StaggerAst.prototype.animation;
/**
 * @record
 */
export function TimingAst() { }
/** @type {?} */
TimingAst.prototype.duration;
/** @type {?} */
TimingAst.prototype.delay;
/** @type {?} */
TimingAst.prototype.easing;
/** @type {?|undefined} */
TimingAst.prototype.dynamic;
/**
 * @record
 */
export function DynamicTimingAst() { }
/** @type {?} */
DynamicTimingAst.prototype.strValue;
/** @type {?} */
DynamicTimingAst.prototype.dynamic;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5pbWF0aW9uX2FzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2FuaW1hdGlvbnMvYnJvd3Nlci9zcmMvZHNsL2FuaW1hdGlvbl9hc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFTQSxNQUFNLHVCQUF1QixHQUFxQixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0FuaW1hdGVUaW1pbmdzLCBBbmltYXRpb25NZXRhZGF0YVR5cGUsIEFuaW1hdGlvbk9wdGlvbnMsIMm1U3R5bGVEYXRhfSBmcm9tICdAYW5ndWxhci9hbmltYXRpb25zJztcblxuY29uc3QgRU1QVFlfQU5JTUFUSU9OX09QVElPTlM6IEFuaW1hdGlvbk9wdGlvbnMgPSB7fTtcblxuZXhwb3J0IGludGVyZmFjZSBBc3RWaXNpdG9yIHtcbiAgdmlzaXRUcmlnZ2VyKGFzdDogVHJpZ2dlckFzdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFN0YXRlKGFzdDogU3RhdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRUcmFuc2l0aW9uKGFzdDogVHJhbnNpdGlvbkFzdCwgY29udGV4dDogYW55KTogYW55O1xuICB2aXNpdFNlcXVlbmNlKGFzdDogU2VxdWVuY2VBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRHcm91cChhc3Q6IEdyb3VwQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QW5pbWF0ZShhc3Q6IEFuaW1hdGVBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRTdHlsZShhc3Q6IFN0eWxlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0S2V5ZnJhbWVzKGFzdDogS2V5ZnJhbWVzQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0UmVmZXJlbmNlKGFzdDogUmVmZXJlbmNlQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QW5pbWF0ZUNoaWxkKGFzdDogQW5pbWF0ZUNoaWxkQXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0QW5pbWF0ZVJlZihhc3Q6IEFuaW1hdGVSZWZBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbiAgdmlzaXRRdWVyeShhc3Q6IFF1ZXJ5QXN0LCBjb250ZXh0OiBhbnkpOiBhbnk7XG4gIHZpc2l0U3RhZ2dlcihhc3Q6IFN0YWdnZXJBc3QsIGNvbnRleHQ6IGFueSk6IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBc3Q8VCBleHRlbmRzIEFuaW1hdGlvbk1ldGFkYXRhVHlwZT4ge1xuICB0eXBlOiBUO1xuICBvcHRpb25zOiBBbmltYXRpb25PcHRpb25zfG51bGw7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJpZ2dlckFzdCBleHRlbmRzIEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGUuVHJpZ2dlcj4ge1xuICB0eXBlOiBBbmltYXRpb25NZXRhZGF0YVR5cGUuVHJpZ2dlcjtcbiAgbmFtZTogc3RyaW5nO1xuICBzdGF0ZXM6IFN0YXRlQXN0W107XG4gIHRyYW5zaXRpb25zOiBUcmFuc2l0aW9uQXN0W107XG4gIHF1ZXJ5Q291bnQ6IG51bWJlcjtcbiAgZGVwQ291bnQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGF0ZUFzdCBleHRlbmRzIEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGUuU3RhdGU+IHtcbiAgdHlwZTogQW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0YXRlO1xuICBuYW1lOiBzdHJpbmc7XG4gIHN0eWxlOiBTdHlsZUFzdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUcmFuc2l0aW9uQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5UcmFuc2l0aW9uPiB7XG4gIG1hdGNoZXJzOiAoKGZyb21TdGF0ZTogc3RyaW5nLCB0b1N0YXRlOiBzdHJpbmcsIGVsZW1lbnQ6IGFueSwgcGFyYW1zOiB7W2tleTogc3RyaW5nXTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW55fSkgPT4gYm9vbGVhbilbXTtcbiAgYW5pbWF0aW9uOiBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlPjtcbiAgcXVlcnlDb3VudDogbnVtYmVyO1xuICBkZXBDb3VudDogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlcXVlbmNlQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5TZXF1ZW5jZT4ge1xuICBzdGVwczogQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT5bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBHcm91cEFzdCBleHRlbmRzIEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGUuR3JvdXA+IHtcbiAgc3RlcHM6IEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGU+W107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQW5pbWF0ZUFzdCBleHRlbmRzIEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGUuQW5pbWF0ZT4ge1xuICB0aW1pbmdzOiBUaW1pbmdBc3Q7XG4gIHN0eWxlOiBTdHlsZUFzdHxLZXlmcmFtZXNBc3Q7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3R5bGVBc3QgZXh0ZW5kcyBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlLlN0eWxlPiB7XG4gIHN0eWxlczogKMm1U3R5bGVEYXRhfHN0cmluZylbXTtcbiAgZWFzaW5nOiBzdHJpbmd8bnVsbDtcbiAgb2Zmc2V0OiBudW1iZXJ8bnVsbDtcbiAgY29udGFpbnNEeW5hbWljU3R5bGVzOiBib29sZWFuO1xuICBpc0VtcHR5U3RlcD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgS2V5ZnJhbWVzQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5LZXlmcmFtZXM+IHsgc3R5bGVzOiBTdHlsZUFzdFtdOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVmZXJlbmNlQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5SZWZlcmVuY2U+IHtcbiAgYW5pbWF0aW9uOiBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbmltYXRlQ2hpbGRBc3QgZXh0ZW5kcyBBc3Q8QW5pbWF0aW9uTWV0YWRhdGFUeXBlLkFuaW1hdGVDaGlsZD4ge31cblxuZXhwb3J0IGludGVyZmFjZSBBbmltYXRlUmVmQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5BbmltYXRlUmVmPiB7XG4gIGFuaW1hdGlvbjogUmVmZXJlbmNlQXN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5QXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5RdWVyeT4ge1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsaW1pdDogbnVtYmVyO1xuICBvcHRpb25hbDogYm9vbGVhbjtcbiAgaW5jbHVkZVNlbGY6IGJvb2xlYW47XG4gIGFuaW1hdGlvbjogQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZT47XG4gIG9yaWdpbmFsU2VsZWN0b3I6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdGFnZ2VyQXN0IGV4dGVuZHMgQXN0PEFuaW1hdGlvbk1ldGFkYXRhVHlwZS5TdGFnZ2VyPiB7XG4gIHRpbWluZ3M6IEFuaW1hdGVUaW1pbmdzO1xuICBhbmltYXRpb246IEFzdDxBbmltYXRpb25NZXRhZGF0YVR5cGU+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRpbWluZ0FzdCB7XG4gIGR1cmF0aW9uOiBudW1iZXI7XG4gIGRlbGF5OiBudW1iZXI7XG4gIGVhc2luZzogc3RyaW5nfG51bGw7XG4gIGR5bmFtaWM/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIER5bmFtaWNUaW1pbmdBc3QgZXh0ZW5kcyBUaW1pbmdBc3Qge1xuICBzdHJWYWx1ZTogc3RyaW5nO1xuICBkeW5hbWljOiB0cnVlO1xufVxuIl19