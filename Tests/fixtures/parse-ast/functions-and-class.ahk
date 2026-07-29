#Requires AutoHotkey v2.0

/**
 * Adds two numbers together.
 * @param a first addend
 * @param b second addend
 */
Add(a, b := 0) {
    return a + b
}

class Widget extends Gui {
    static Version := "1.0.0"

    /**
     * Construct a new widget.
     */
    __New(title) {
        this.title := title
    }

    Render() {
        return this.title
    }
}
