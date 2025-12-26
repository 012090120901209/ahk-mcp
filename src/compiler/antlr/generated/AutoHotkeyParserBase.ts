import { Parser, ParserRuleContext, TokenStream } from 'antlr4ng';
import { AutoHotkeyParser } from './AutoHotkeyParser.js';
import { AutoHotkeyLexer } from './AutoHotkeyLexer.js';

export abstract class AutoHotkeyParserBase extends Parser {
  protected _input: TokenStream;
  constructor(input: TokenStream) {
    super(input);
    this._input = input;
  }

  protected isValidLoopExpression(): boolean {
    const next = this.inputStream.LA(2);
    if (
      next == AutoHotkeyLexer.Parse ||
      next == AutoHotkeyLexer.Reg ||
      next == AutoHotkeyLexer.Read ||
      next == AutoHotkeyLexer.Files
    )
      return false;
    return true;
  }

  protected isFunctionStatement(): boolean {
    let enclosableDepth = 0;
    let i = 0;
    let nextToken = -2;

    // LA(k) looks ahead k tokens in the input stream
    while (nextToken !== AutoHotkeyLexer.EOF) {
      i++;
      nextToken = this.inputStream.LA(i);

      switch (nextToken) {
        case AutoHotkeyLexer.OpenBrace:
          if (enclosableDepth === 0) {
            // starting with “{” at depth 0 can’t be a function call
            return false;
          }
          enclosableDepth++;
          break;

        case AutoHotkeyLexer.OpenParen:
          if (enclosableDepth === 0) {
            return false;
          }
          enclosableDepth++;
          break;

        case AutoHotkeyLexer.OpenBracket:
        case AutoHotkeyLexer.DerefStart:
          enclosableDepth++;
          break;

        case AutoHotkeyLexer.CloseParen:
        case AutoHotkeyLexer.CloseBracket:
        case AutoHotkeyLexer.CloseBrace:
        case AutoHotkeyLexer.DerefEnd:
          enclosableDepth--;
          // if we just closed back to depth 0, skip out to the next LA()
          if (enclosableDepth === 0) {
            continue;
          }
          break;
      }

      // if we’re still inside a nested grouping, keep scanning
      if (enclosableDepth !== 0) {
        continue;
      }

      // At depth 0, decide based on the next token
      switch (nextToken) {
        case AutoHotkeyLexer.Identifier:
        case AutoHotkeyLexer.This:
        case AutoHotkeyLexer.Dot:
          // names and property access can prefix a call
          continue;

        case AutoHotkeyLexer.WS:
        case AutoHotkeyLexer.EOL:
        case AutoHotkeyLexer.EOF:
          // whitespace, newline or EOF after an identifier/dot means it’s a call
          return true;

        case AutoHotkeyLexer.Comma:
          // comma at position 2 (i===2) means “myFunc,…” without parens → error
          if (i === 2) {
            // grab the offending token for line/column
            const tok = this.tokenStream.get(this.inputStream.index + 1);
            throw new Error(
              `Syntax error at line ${tok.line}:${tok.column} — ` +
                `Function calls require a space or \"(\"; commas only separate parameters.`
            );
          }
          return false;

        default:
          return false;
      }
    }

    return false;
  }

  protected isValidLabel(): boolean {
    if (this.inputStream.LA(1) != AutoHotkeyLexer.Default) return true;
    let ctx: ParserRuleContext | null = this.context;
    while (ctx) {
      if (ctx.ruleIndex === AutoHotkeyParser.RULE_caseClause) return false;
      if (ctx.ruleIndex === AutoHotkeyParser.RULE_block) return true;
      ctx = (ctx.parent as ParserRuleContext) ?? null;
    }
    return true;
  }

  protected second(token: number): boolean {
    return this._input.LA(2) == token;
  }
}
