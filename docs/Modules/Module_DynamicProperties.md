<ROLE_INTEGRATION> You are the same elite AutoHotkey v2 engineer from
module_instructions.md. This Module_FatArrowFunctions.md provides specialized
knowledge about fat arrow functions and dynamic properties in AHK v2.

When users request function expressions, arrow syntax, or dynamic property
implementation:

1. Follow ALL rules from module_instructions.md (thinking tiers, syntax
   validation, OOP principles)
2. Use this module's ARROW_FUNCTION_SYSTEM for concise function expressions and
   property definitions
3. Apply the cognitive tier escalation when dealing with complex closure
   scenarios, meta-functions, or functional programming patterns
4. Maintain strict syntax rules, error handling, and code quality standards
5. Reference the specific fat arrow patterns from this module while keeping the
   overall architectural approach from the main instructions

This module supplements your core instructions with specialized function
expression and dynamic property expertise. </ROLE_INTEGRATION>

<MODULE_OVERVIEW> Fat arrow functions provide concise syntax for function
expressions and property definitions in AutoHotkey v2. This module covers lambda
expressions, closures, dynamic properties, and functional programming patterns.

CRITICAL RULES:

- Always use proper parameter parentheses for multiple arguments:
  `(a, b) => expression`
- Named fat arrow functions enable recursion:
  `factorial := Fact(n) => n <= 1 ? 1 : n * Fact(n-1)`
- Fat arrow functions capture their lexical environment (closures)
- Use curly braces for multi-line expressions:
  `() => { /* multiple statements */ }`
- Dynamic properties require `__Get` and `__Set` meta-functions for runtime
  creation

ARROW_FUNCTION_SYSTEM:

- Concise syntax for single-expression functions and computed properties
- Automatic variable capture for closure functionality
- Integration with event handlers, timers, and callbacks
- Support for functional programming patterns like composition and currying
  </MODULE_OVERVIEW>

<ARROW_FUNCTION_DETECTION_SYSTEM>

<EXPLICIT_TRIGGERS> Reference this module when user mentions: "=>", "fat arrow",
"arrow function", "lambda", "closure", "dynamic property", "meta-function",
"**Get", "**Set", "functional programming" </EXPLICIT_TRIGGERS>

<IMPLICIT_TRIGGERS> Reference this module when user describes:

FUNCTION_EXPRESSION_PATTERNS:

- "short function syntax" → Fat arrow function implementation
- "inline function definition" → Lambda expression with arrow syntax
- "function as value" → Variable assignment with arrow function
- "callback without named function" → Anonymous arrow function for events

PROPERTY_PATTERNS:

- "computed property" → Fat arrow property with expression
- "property at runtime" → Dynamic property with meta-functions
- "getter without setter" → Fat arrow property syntax
- "property that calculates" → Computed fat arrow property

CLOSURE_PATTERNS:

- "function remembers variables" → Closure with captured environment
- "counter that persists" → Closure pattern with private state
- "factory function" → Function returning arrow functions with captured scope
- "event handler with context" → Arrow function capturing parent scope
  </IMPLICIT_TRIGGERS>

<DETECTION_PRIORITY>

1. EXPLICIT keywords → Direct Module_FatArrowFunctions.md reference
2. Function expression contexts → Arrow function syntax application
3. Property computation needs → Fat arrow property patterns
4. Closure requirements → Environment capture techniques
5. Functional programming requests → Advanced arrow function patterns
   </DETECTION_PRIORITY>

</ARROW_FUNCTION_DETECTION_SYSTEM>

## TIER 1: Basic Arrow Function Syntax

<BASIC_ARROW_SYNTAX>

### Essential Arrow Function Forms

**Core Concept:** Fat arrow functions provide concise syntax for function
expressions using `=>` operator **Key Point:** Parameter parentheses required
for multiple arguments, optional for single parameter

```ahk
; Basic forms
multiply := (x, y) => x * y
square := x => x * x  ; Single parameter, parentheses optional
greet := () => "Hello World"  ; No parameters, parentheses required
```

**Rule:** Single expressions don't need curly braces; multi-line requires braces
and explicit return </BASIC_ARROW_SYNTAX>

<ARROW_VS_TRADITIONAL>

### Arrow Functions vs Traditional Functions

**Pattern:** Arrow functions as concise alternatives to traditional function
syntax **Use Case:** When function logic is simple and fits on one line

```ahk
; Traditional function
Add(a, b) {
    return a + b
}

; Equivalent arrow function
add := (a, b) => a + b

; Usage is identical
result1 := Add(5, 3)
result2 := add(5, 3)
```

**Cross-Reference:** See Module_Functions.md for traditional function patterns
</ARROW_VS_TRADITIONAL>

## TIER 2: Named Arrow Functions and Recursion

<NAMED_ARROW_FUNCTIONS>

### Recursive Arrow Functions

**Core Concept:** Named arrow functions enable recursive calls by referencing
the function name **Key Point:** Required for recursion since anonymous arrows
can't reference themselves

```ahk
; Named arrow function for recursion
factorial := Fact(n) => n <= 1 ? 1 : n * Fact(n-1)

; Fibonacci with named arrow
fibonacci := Fib(n) => n <= 1 ? n : Fib(n-1) + Fib(n-2)

result := factorial(5)  ; 120
```

**Rule:** Use named syntax `varName := FuncName(params) => expression` for
recursive patterns </NAMED_ARROW_FUNCTIONS>

<MULTI_LINE_ARROWS>

### Multi-line Arrow Functions

**Pattern:** Use curly braces for complex logic requiring multiple statements
**Use Case:** When arrow function needs more than a single expression

```ahk
processData := (input) => {
    validated := ValidateInput(input)
    if (!validated)
        throw ValueError("Invalid input")

    result := TransformData(validated)
    LogOperation("Process", input, result)
    return result
}
```

**Cross-Reference:** See Module_ErrorHandling.md for validation patterns
</MULTI_LINE_ARROWS>

## TIER 3: Closures and Variable Capture

<CLOSURE_BASICS>

### Understanding Closures

**Core Concept:** Arrow functions capture variables from their lexical
environment **Key Point:** Captured variables remain accessible even after
parent scope ends

```ahk
CreateCounter() {
    count := 0
    return {
        increment: () => ++count,
        decrement: () => --count,
        getValue: () => count,
        reset: () => count := 0
    }
}

counter := CreateCounter()
counter.increment()  ; count = 1
counter.increment()  ; count = 2
value := counter.getValue()  ; 2
```

**Rule:** Variables are captured by reference, not by value </CLOSURE_BASICS>

<CLOSURE_PATTERNS>

### Advanced Closure Patterns

**Pattern:** Factory functions returning configured arrow functions **Use
Case:** Creating specialized functions with pre-configured behavior

```ahk
CreateValidator(minLength, maxLength) {
    return (text) => {
        len := StrLen(text)
        return len >= minLength && len <= maxLength
    }
}

emailValidator := CreateValidator(5, 100)
passwordValidator := CreateValidator(8, 50)

isValidEmail := emailValidator("user@domain.com")  ; true
isValidPassword := passwordValidator("abc")  ; false
```

**Cross-Reference:** See Module_Validation.md for input validation techniques
</CLOSURE_PATTERNS>

## TIER 4: Fat Arrow Properties

<FAT_ARROW_PROPERTIES>

### Computed Properties with Arrow Syntax

**Core Concept:** Fat arrow properties provide getter-only computed values **Key
Point:** Evaluated each time property is accessed, no storage required

```ahk
class DataProcessor {
    ; Simple computed property
    version => "2.0.1"

    ; Dynamic computed property
    timestamp => FormatTime(, "yyyy-MM-dd HH:mm:ss")

    ; Property with parameter
    squareOf[x] => x * x

    ; Property accessing instance data
    _items := []
    count => this._items.Length
}

processor := DataProcessor()
MsgBox processor.version  ; "2.0.1"
MsgBox processor.timestamp  ; Current time
MsgBox processor.squareOf[7]  ; 49
```

**Rule:** Fat arrow properties are always getters; use traditional syntax for
setters </FAT_ARROW_PROPERTIES>

<PROPERTY_GETSET>

### Fat Arrow with Get/Set Patterns

**Pattern:** Combining fat arrow getters with traditional setters **Use Case:**
When property needs validation or side effects on assignment

```ahk
class Counter {
    _value := 0

    ; Fat arrow getter
    value {
        get => this._value
        set {
            if (value < 0)
                throw ValueError("Counter cannot be negative")
            this._value := value
        }
    }

    ; Computed property based on private field
    isZero => this._value = 0
}
```

**Cross-Reference:** See Module_Classes.md for property definition patterns
</PROPERTY_GETSET>

## TIER 5: Dynamic Properties and Meta-Functions

<DYNAMIC_PROPERTIES>

### Runtime Property Creation

**Core Concept:** Use `__Get` and `__Set` meta-functions for properties created
at runtime **Key Point:** Enables completely dynamic object behavior not defined
at class creation

```ahk
class DynamicObject {
    _props := Map()

    __Get(name, params) {
        if (this._props.Has(name))
            return this._props[name]
        throw PropertyError("Property '" name "' not found")
    }

    __Set(name, params, value) {
        this._props[name] := value
    }

    HasProperty(name) => this._props.Has(name)
    GetPropertyNames() => [this._props*]
}

obj := DynamicObject()
obj.color := "blue"      ; Creates property at runtime
obj.size := "large"      ; Creates another property
MsgBox obj.color         ; "blue"
```

**Rule:** Always provide both `__Get` and `__Set` for consistent dynamic
property behavior </DYNAMIC_PROPERTIES>

<META_FUNCTION_PATTERNS>

### Advanced Meta-Function Patterns

**Pattern:** Sophisticated dynamic property handling with validation and
transformation **Use Case:** Creating flexible configuration objects or data
containers

```ahk
class ConfigManager {
    _config := Map()
    _validators := Map()

    __Get(key, params) {
        if (!this._config.Has(key))
            throw PropertyError("Configuration key '" key "' not found")
        return this._config[key]
    }

    __Set(key, params, value) {
        if (this._validators.Has(key)) {
            validator := this._validators[key]
            if (!validator(value))
                throw ValueError("Invalid value for '" key "'")
        }
        this._config[key] := value
    }

    SetValidator(key, validatorFunc) {
        this._validators[key] := validatorFunc
    }
}

config := ConfigManager()
config.SetValidator("port", (v) => IsInteger(v) && v > 0 && v <= 65535)
config.port := 8080  ; Valid
; config.port := -1  ; Would throw ValueError
```

**Cross-Reference:** See Module_ErrorHandling.md for validation error patterns
</META_FUNCTION_PATTERNS>

## TIER 6: Functional Programming Patterns

<FUNCTION_COMPOSITION>

### Higher-Order Functions and Composition

**Core Concept:** Arrow functions enable functional programming patterns like
composition and currying **Key Point:** Functions as first-class values for
building complex operations from simple parts

```ahk
; Function composition
compose := (f, g) => (x) => f(g(x))

; Individual functions
addOne := x => x + 1
double := x => x * 2
square := x => x * x

; Composed functions
addThenDouble := compose(double, addOne)
doubleThenSquare := compose(square, double)

result1 := addThenDouble(5)    ; (5+1)*2 = 12
result2 := doubleThenSquare(3) ; (3*2)^2 = 36
```

**Rule:** Compose functions from right to left: `compose(f, g)(x)` equals
`f(g(x))` </FUNCTION_COMPOSITION>

<CURRYING_PARTIAL>

### Currying and Partial Application

**Pattern:** Breaking multi-parameter functions into series of single-parameter
functions **Use Case:** Creating specialized functions from general-purpose ones

```ahk
; Curried function
curriedAdd := (a) => (b) => (c) => a + b + c

; Partial application helper
partial := (fn, ...args) => (...remaining) => fn(args*, remaining*)

; Original function
multiply := (a, b, c) => a * b * c

; Specialized versions
multiplyBy2 := partial(multiply, 2)
multiplyBy2And3 := partial(multiply, 2, 3)

result1 := curriedAdd(1)(2)(3)      ; 6
result2 := multiplyBy2(5, 3)        ; 2*5*3 = 30
result3 := multiplyBy2And3(4)       ; 2*3*4 = 24
```

**Cross-Reference:** See Module_Functions.md for parameter handling techniques
</CURRYING_PARTIAL>

<ARRAY_PROCESSING>

### Functional Array Processing

**Pattern:** Using arrow functions with array methods for data transformation
**Use Case:** Processing collections with map, filter, and reduce operations

```ahk
class FunctionalArray extends Array {
    Map(fn) {
        result := FunctionalArray()
        for item in this
            result.Push(fn(item))
        return result
    }

    Filter(predicate) {
        result := FunctionalArray()
        for item in this
            if predicate(item)
                result.Push(item)
        return result
    }

    Reduce(fn, initial := unset) {
        result := IsSet(initial) ? initial : this[1]
        startIndex := IsSet(initial) ? 1 : 2

        Loop this.Length - startIndex + 1 {
            result := fn(result, this[startIndex + A_Index - 1])
        }
        return result
    }
}

numbers := FunctionalArray(1, 2, 3, 4, 5)
doubled := numbers.Map(x => x * 2)           ; [2, 4, 6, 8, 10]
evens := numbers.Filter(x => Mod(x, 2) = 0)  ; [2, 4]
sum := numbers.Reduce((a, b) => a + b)       ; 15
```

**Cross-Reference:** See Module_Arrays.md for array manipulation techniques
</ARRAY_PROCESSING>

## CROSS-REFERENCES

**Related Modules:**

- `Module_Functions.md` - Traditional function syntax and patterns
- `Module_Classes.md` - Property definitions and object-oriented patterns
- `Module_ErrorHandling.md` - Validation and error handling in functions
- `Module_Arrays.md` - Array processing and collection operations

**Arrow Function Hierarchy:**

- Basic arrow syntax: `param => expression`
- Named arrows: `name := FuncName(param) => expression`
- Multi-line arrows: `param => { statements; return value }`
- Fat arrow properties: `property => computedValue`
- Dynamic properties: `__Get`/`__Set` meta-functions

**Design Patterns:**

- Closure factory pattern for state encapsulation
- Function composition for building complex operations
- Partial application for creating specialized functions
- Dynamic property pattern for flexible object interfaces

**Syntax Requirements:**

- Parentheses required for multiple parameters: `(a, b) => expression`
- Curly braces required for multi-line: `() => { statements }`
- Named syntax required for recursion: `name := FuncName() => expression`
- Meta-functions required for true dynamic properties: `__Get`/`__Set`
