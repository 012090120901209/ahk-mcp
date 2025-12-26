import { Lexer, CharStream, Token } from 'antlr4ng';
import { AutoHotkeyLexer } from './AutoHotkeyLexer.js';

export abstract class AutoHotkeyLexerBase extends Lexer {
  protected _input: CharStream;
  private _lastToken: Token | null = null;
  private _lastVisibleToken: Token | null = null;
  private _isBOS: boolean = true;
  private _currentDepth: number = 0;
  private _hotstringIsLiteral: boolean = true;
  private _derefDepth: number = 0;

  private _lineContinuationOperators = new Set<number>([
    AutoHotkeyLexer.OpenBracket,
    AutoHotkeyLexer.OpenBrace,
    AutoHotkeyLexer.OpenParen,
    AutoHotkeyLexer.DerefStart,
    AutoHotkeyLexer.Comma,
    AutoHotkeyLexer.Assign,
    AutoHotkeyLexer.QuestionMark,
    AutoHotkeyLexer.QuestionMarkDot,
    AutoHotkeyLexer.Plus,
    AutoHotkeyLexer.Minus,
    AutoHotkeyLexer.Divide,
    AutoHotkeyLexer.IntegerDivide,
    AutoHotkeyLexer.NullCoalesce,
    AutoHotkeyLexer.RightShiftArithmetic,
    AutoHotkeyLexer.LeftShiftArithmetic,
    AutoHotkeyLexer.RightShiftLogical,
    AutoHotkeyLexer.LessThan,
    AutoHotkeyLexer.MoreThan,
    AutoHotkeyLexer.LessThanEquals,
    AutoHotkeyLexer.GreaterThanEquals,
    AutoHotkeyLexer.Equals_,
    AutoHotkeyLexer.NotEquals,
    AutoHotkeyLexer.IdentityEquals,
    AutoHotkeyLexer.IdentityNotEquals,
    AutoHotkeyLexer.RegExMatch,
    AutoHotkeyLexer.BitAnd,
    AutoHotkeyLexer.BitXOr,
    AutoHotkeyLexer.BitOr,
    AutoHotkeyLexer.And,
    AutoHotkeyLexer.Or,
    AutoHotkeyLexer.MultiplyAssign,
    AutoHotkeyLexer.DivideAssign,
    AutoHotkeyLexer.ModulusAssign,
    AutoHotkeyLexer.PlusAssign,
    AutoHotkeyLexer.MinusAssign,
    AutoHotkeyLexer.LeftShiftArithmeticAssign,
    AutoHotkeyLexer.RightShiftArithmeticAssign,
    AutoHotkeyLexer.RightShiftLogicalAssign,
    AutoHotkeyLexer.IntegerDivideAssign,
    AutoHotkeyLexer.ConcatenateAssign,
    AutoHotkeyLexer.BitAndAssign,
    AutoHotkeyLexer.BitXorAssign,
    AutoHotkeyLexer.BitOrAssign,
    AutoHotkeyLexer.PowerAssign,
    AutoHotkeyLexer.NullishCoalescingAssign,
    AutoHotkeyLexer.Arrow,
  ]);

  constructor(input: CharStream) {
    super(input);
    this._input = input;
  }

  public override nextToken(): Token {
    const next = super.nextToken();
    // record last visible token
    if (next.channel === Token.DEFAULT_CHANNEL) {
      this._lastVisibleToken = next;
    }
    // track newlines for BOS
    if (next.type === AutoHotkeyLexer.EOL) {
      this._isBOS = true;
    } else if (next.type !== AutoHotkeyLexer.WS) {
      this._isBOS = false;
    }
    // record last token
    this._lastToken = next;
    return next;
  }

  protected ProcessOpenBracket(): void {
    this._currentDepth++;
  }
  protected ProcessCloseBracket(): void {
    this._currentDepth--;
  }
  protected ProcessOpenParen(): void {
    this._currentDepth++;
  }
  protected ProcessCloseParen(): void {
    this._currentDepth--;
  }
  protected ProcessDeref(): void {
    if (this._derefDepth === 0) {
      this._derefDepth++;
      this._currentDepth++;
      this.type = AutoHotkeyLexer.DerefStart;
    } else {
      this._derefDepth--;
      this._currentDepth--;
      this.type = AutoHotkeyLexer.DerefEnd;
    }
  }

  protected ProcessHotstringOpenBrace(): void {
    this.type = AutoHotkeyLexer.OpenBrace;
    this.ProcessOpenBracket();
  }

  protected ProcessStringLiteral(): void {
    return;
  }
  protected ProcessEOL(): void {
    if (this._currentDepth !== 0) {
      this.type = (this.constructor as any).WS;
      return;
    }
    if (!this._lastVisibleToken) return;
    const ctor = this.constructor as any;
    const lineOps = this._lineContinuationOperators;
    if (
      this._lastVisibleToken.type !== ctor.OpenBrace &&
      lineOps.has(this._lastVisibleToken.type)
    ) {
      this.channel = Lexer.HIDDEN;
    }
  }
  protected ProcessWS(): void {
    if (!this._lastVisibleToken) return;
    const lineOps = this._lineContinuationOperators;
    if (lineOps.has(this._lastVisibleToken.type)) {
      this.channel = Lexer.HIDDEN;
    }
  }

  protected IsBOS(): boolean {
    return this._isBOS;
  }
  protected IsCommentPossible(): boolean {
    const start = this.tokenStartCharIndex;
    if (start === 0) return true;
    const prevChar = this._input.getTextFromRange(start - 1, start - 1).charAt(0);
    if (!prevChar) return false;
    return (
      /\s/.test(prevChar) ||
      prevChar === '\n' ||
      prevChar === '\r' ||
      prevChar === '\u2028' ||
      prevChar === '\u2029'
    );
  }

  protected IsValidDotDecimal(): boolean {
    if (!this._lastToken || this._lastToken.channel !== Token.DEFAULT_CHANNEL) {
      return true;
    }
    const lineOps = this._lineContinuationOperators;
    return lineOps.has(this._lastVisibleToken!.type);
  }

  protected IsValidRemap(): boolean {
    if (this._input.LA(-1) === '{'.charCodeAt(0) && this._input.LA(-2) !== '`'.charCodeAt(0)) {
      return false;
    }
    let i = 0;
    while (true) {
      i++;
      const next = this._input.LA(i);
      switch (next) {
        case AutoHotkeyLexer.EOF:
        case '\n'.charCodeAt(0):
        case '\r'.charCodeAt(0):
          return true;
        case ' '.charCodeAt(0):
        case 0x2028:
        case 0x2029:
          continue;
        case ';'.charCodeAt(0):
          return i !== 1;
        case '/'.charCodeAt(0):
          return this._input.LA(i + 1) === '*'.charCodeAt(0);
        default:
          return false;
      }
    }
  }

  private _processHotstringOptions(text: string): number {
    let res = -1;
    for (let i = 0; i < text.length; i++) {
      const c = text.charAt(i);
      if (c === ':' || c === ';' || c === '/') break;
      if (c === 'x' || c === 'X') {
        res = i === text.length - 1 ? 1 : text.charAt(i + 1) === '0' ? 0 : 1;
      }
    }
    return res;
  }
  protected ProcessHotstringOptions(): void {
    if ((this._lastToken?.type ?? -1) == AutoHotkeyLexer.EndChars) return;
    const intermediate = this._processHotstringOptions(this.text);
    if (intermediate !== -1) {
      this._hotstringIsLiteral = intermediate === 0;
    }
  }
  protected IsHotstringLiteral(): boolean {
    const intermediate = this._processHotstringOptions(this.text.substring(1));
    return intermediate === -1 ? this._hotstringIsLiteral : intermediate === 0;
  }
}
