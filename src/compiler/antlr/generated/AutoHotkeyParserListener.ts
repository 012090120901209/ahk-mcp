// Generated from c:/Users/minip/source/repos/ahk2-antlr4-demo/src/grammar/AutoHotkeyParser.g4 by ANTLR 4.13.1

import { ErrorNode, ParseTreeListener, ParserRuleContext, TerminalNode } from 'antlr4ng';

import { AutoHotkeyParserBase } from './AutoHotkeyParserBase.js';

import { ProgramContext } from './AutoHotkeyParser.js';
import { SourceElementsContext } from './AutoHotkeyParser.js';
import { SourceElementContext } from './AutoHotkeyParser.js';
import { DirectiveContext } from './AutoHotkeyParser.js';
import { HotIfDirectiveContext } from './AutoHotkeyParser.js';
import { HotstringDirectiveContext } from './AutoHotkeyParser.js';
import { InputLevelDirectiveContext } from './AutoHotkeyParser.js';
import { UseHookDirectiveContext } from './AutoHotkeyParser.js';
import { SuspendExemptDirectiveContext } from './AutoHotkeyParser.js';
import { TextualDirectiveContext } from './AutoHotkeyParser.js';
import { PersistentDirectiveContext } from './AutoHotkeyParser.js';
import { OptionalTextualDirectiveContext } from './AutoHotkeyParser.js';
import { SingleDirectiveContext } from './AutoHotkeyParser.js';
import { NumericDirectiveContext } from './AutoHotkeyParser.js';
import { RemapContext } from './AutoHotkeyParser.js';
import { HotstringContext } from './AutoHotkeyParser.js';
import { HotstringExpansionContext } from './AutoHotkeyParser.js';
import { HotkeyContext } from './AutoHotkeyParser.js';
import { StatementContext } from './AutoHotkeyParser.js';
import { BlockStatementContext } from './AutoHotkeyParser.js';
import { BlockContext } from './AutoHotkeyParser.js';
import { StatementListContext } from './AutoHotkeyParser.js';
import { VariableStatementContext } from './AutoHotkeyParser.js';
import { DeclarationContext } from './AutoHotkeyParser.js';
import { VariableDeclarationListContext } from './AutoHotkeyParser.js';
import { VariableDeclarationContext } from './AutoHotkeyParser.js';
import { FunctionStatementContext } from './AutoHotkeyParser.js';
import { ExpressionStatementContext } from './AutoHotkeyParser.js';
import { IfStatementContext } from './AutoHotkeyParser.js';
import { FlowBlockContext } from './AutoHotkeyParser.js';
import { UntilProductionContext } from './AutoHotkeyParser.js';
import { ElseProductionContext } from './AutoHotkeyParser.js';
import { SpecializedLoopStatementContext } from './AutoHotkeyParser.js';
import { LoopStatementContext } from './AutoHotkeyParser.js';
import { WhileStatementContext } from './AutoHotkeyParser.js';
import { ForInStatementContext } from './AutoHotkeyParser.js';
import { ForInParametersContext } from './AutoHotkeyParser.js';
import { ContinueStatementContext } from './AutoHotkeyParser.js';
import { BreakStatementContext } from './AutoHotkeyParser.js';
import { ReturnStatementContext } from './AutoHotkeyParser.js';
import { SwitchStatementContext } from './AutoHotkeyParser.js';
import { CaseBlockContext } from './AutoHotkeyParser.js';
import { CaseClauseContext } from './AutoHotkeyParser.js';
import { LabelledStatementContext } from './AutoHotkeyParser.js';
import { GotoStatementContext } from './AutoHotkeyParser.js';
import { ThrowStatementContext } from './AutoHotkeyParser.js';
import { TryStatementContext } from './AutoHotkeyParser.js';
import { CatchProductionContext } from './AutoHotkeyParser.js';
import { CatchAssignableContext } from './AutoHotkeyParser.js';
import { CatchClassesContext } from './AutoHotkeyParser.js';
import { FinallyProductionContext } from './AutoHotkeyParser.js';
import { FunctionDeclarationContext } from './AutoHotkeyParser.js';
import { ClassDeclarationContext } from './AutoHotkeyParser.js';
import { ClassExtensionNameContext } from './AutoHotkeyParser.js';
import { ClassTailContext } from './AutoHotkeyParser.js';
import { ClassMethodDeclarationContext } from './AutoHotkeyParser.js';
import { ClassPropertyDeclarationContext } from './AutoHotkeyParser.js';
import { ClassFieldDeclarationContext } from './AutoHotkeyParser.js';
import { NestedClassDeclarationContext } from './AutoHotkeyParser.js';
import { MethodDefinitionContext } from './AutoHotkeyParser.js';
import { PropertyDefinitionContext } from './AutoHotkeyParser.js';
import { ClassPropertyNameContext } from './AutoHotkeyParser.js';
import { PropertyGetterDefinitionContext } from './AutoHotkeyParser.js';
import { PropertySetterDefinitionContext } from './AutoHotkeyParser.js';
import { FieldDefinitionContext } from './AutoHotkeyParser.js';
import { FormalParameterListContext } from './AutoHotkeyParser.js';
import { FormalParameterArgContext } from './AutoHotkeyParser.js';
import { LastFormalParameterArgContext } from './AutoHotkeyParser.js';
import { ArrayLiteralContext } from './AutoHotkeyParser.js';
import { PropertyAssignmentContext } from './AutoHotkeyParser.js';
import { PropertyNameContext } from './AutoHotkeyParser.js';
import { DereferenceContext } from './AutoHotkeyParser.js';
import { ArgumentsContext } from './AutoHotkeyParser.js';
import { ArgumentContext } from './AutoHotkeyParser.js';
import { ExpressionSequenceContext } from './AutoHotkeyParser.js';
import { MemberIndexArgumentsContext } from './AutoHotkeyParser.js';
import { PostIncrementDecrementExpressionContext } from './AutoHotkeyParser.js';
import { AdditiveExpressionContext } from './AutoHotkeyParser.js';
import { RelationalExpressionContext } from './AutoHotkeyParser.js';
import { TernaryExpressionContext } from './AutoHotkeyParser.js';
import { PreIncrementDecrementExpressionContext } from './AutoHotkeyParser.js';
import { LogicalAndExpressionContext } from './AutoHotkeyParser.js';
import { PowerExpressionContext } from './AutoHotkeyParser.js';
import { FatArrowExpressionContext } from './AutoHotkeyParser.js';
import { LogicalOrExpressionContext } from './AutoHotkeyParser.js';
import { UnaryExpressionContext } from './AutoHotkeyParser.js';
import { AtomExpressionContext } from './AutoHotkeyParser.js';
import { RegExMatchExpressionContext } from './AutoHotkeyParser.js';
import { IsExpressionContext } from './AutoHotkeyParser.js';
import { AssignmentExpressionContext } from './AutoHotkeyParser.js';
import { BitAndExpressionContext } from './AutoHotkeyParser.js';
import { BitOrExpressionContext } from './AutoHotkeyParser.js';
import { ConcatenateExpressionContext } from './AutoHotkeyParser.js';
import { BitXOrExpressionContext } from './AutoHotkeyParser.js';
import { EqualityExpressionContext } from './AutoHotkeyParser.js';
import { VerbalNotExpressionContext } from './AutoHotkeyParser.js';
import { MultiplicativeExpressionContext } from './AutoHotkeyParser.js';
import { CoalesceExpressionContext } from './AutoHotkeyParser.js';
import { BitShiftExpressionContext } from './AutoHotkeyParser.js';
import { ParenthesizedExpressionContext } from './AutoHotkeyParser.js';
import { ObjectLiteralExpressionContext } from './AutoHotkeyParser.js';
import { VarRefExpressionContext } from './AutoHotkeyParser.js';
import { DynamicIdentifierExpressionContext } from './AutoHotkeyParser.js';
import { LiteralExpressionContext } from './AutoHotkeyParser.js';
import { ArrayLiteralExpressionContext } from './AutoHotkeyParser.js';
import { AccessExpressionContext } from './AutoHotkeyParser.js';
import { IdentifierExpressionContext } from './AutoHotkeyParser.js';
import { MemberAccessContext } from './AutoHotkeyParser.js';
import { IndexAccessContext } from './AutoHotkeyParser.js';
import { FunctionCallAccessContext } from './AutoHotkeyParser.js';
import { AllowUnsetAccessContext } from './AutoHotkeyParser.js';
import { MemberDotContext } from './AutoHotkeyParser.js';
import { MemberIdentifierContext } from './AutoHotkeyParser.js';
import { DynamicIdentifierContext } from './AutoHotkeyParser.js';
import { InitializerContext } from './AutoHotkeyParser.js';
import { AssignableContext } from './AutoHotkeyParser.js';
import { ObjectLiteralContext } from './AutoHotkeyParser.js';
import { FunctionHeadContext } from './AutoHotkeyParser.js';
import { FunctionHeadPrefixContext } from './AutoHotkeyParser.js';
import { FunctionExpressionHeadContext } from './AutoHotkeyParser.js';
import { FatArrowExpressionHeadContext } from './AutoHotkeyParser.js';
import { FunctionBodyContext } from './AutoHotkeyParser.js';
import { AssignmentOperatorContext } from './AutoHotkeyParser.js';
import { LiteralContext } from './AutoHotkeyParser.js';
import { BooleanContext } from './AutoHotkeyParser.js';
import { NumericLiteralContext } from './AutoHotkeyParser.js';
import { GetterContext } from './AutoHotkeyParser.js';
import { SetterContext } from './AutoHotkeyParser.js';
import { IdentifierNameContext } from './AutoHotkeyParser.js';
import { IdentifierContext } from './AutoHotkeyParser.js';
import { ReservedWordContext } from './AutoHotkeyParser.js';
import { KeywordContext } from './AutoHotkeyParser.js';
import { SContext } from './AutoHotkeyParser.js';
import { EosContext } from './AutoHotkeyParser.js';

/**
 * This interface defines a complete listener for a parse tree produced by
 * `AutoHotkeyParser`.
 */
export class AutoHotkeyParserListener implements ParseTreeListener {
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.program`.
   * @param ctx the parse tree
   */
  enterProgram?: (ctx: ProgramContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.program`.
   * @param ctx the parse tree
   */
  exitProgram?: (ctx: ProgramContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.sourceElements`.
   * @param ctx the parse tree
   */
  enterSourceElements?: (ctx: SourceElementsContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.sourceElements`.
   * @param ctx the parse tree
   */
  exitSourceElements?: (ctx: SourceElementsContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.sourceElement`.
   * @param ctx the parse tree
   */
  enterSourceElement?: (ctx: SourceElementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.sourceElement`.
   * @param ctx the parse tree
   */
  exitSourceElement?: (ctx: SourceElementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.directive`.
   * @param ctx the parse tree
   */
  enterDirective?: (ctx: DirectiveContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.directive`.
   * @param ctx the parse tree
   */
  exitDirective?: (ctx: DirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `HotIfDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  enterHotIfDirective?: (ctx: HotIfDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `HotIfDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  exitHotIfDirective?: (ctx: HotIfDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `HotstringDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  enterHotstringDirective?: (ctx: HotstringDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `HotstringDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  exitHotstringDirective?: (ctx: HotstringDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `InputLevelDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  enterInputLevelDirective?: (ctx: InputLevelDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `InputLevelDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  exitInputLevelDirective?: (ctx: InputLevelDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `UseHookDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  enterUseHookDirective?: (ctx: UseHookDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `UseHookDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  exitUseHookDirective?: (ctx: UseHookDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `SuspendExemptDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  enterSuspendExemptDirective?: (ctx: SuspendExemptDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `SuspendExemptDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   */
  exitSuspendExemptDirective?: (ctx: SuspendExemptDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `TextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  enterTextualDirective?: (ctx: TextualDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `TextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  exitTextualDirective?: (ctx: TextualDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `PersistentDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  enterPersistentDirective?: (ctx: PersistentDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `PersistentDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  exitPersistentDirective?: (ctx: PersistentDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `OptionalTextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  enterOptionalTextualDirective?: (ctx: OptionalTextualDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `OptionalTextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  exitOptionalTextualDirective?: (ctx: OptionalTextualDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `SingleDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  enterSingleDirective?: (ctx: SingleDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `SingleDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  exitSingleDirective?: (ctx: SingleDirectiveContext) => void;
  /**
   * Enter a parse tree produced by the `NumericDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  enterNumericDirective?: (ctx: NumericDirectiveContext) => void;
  /**
   * Exit a parse tree produced by the `NumericDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   */
  exitNumericDirective?: (ctx: NumericDirectiveContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.remap`.
   * @param ctx the parse tree
   */
  enterRemap?: (ctx: RemapContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.remap`.
   * @param ctx the parse tree
   */
  exitRemap?: (ctx: RemapContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.hotstring`.
   * @param ctx the parse tree
   */
  enterHotstring?: (ctx: HotstringContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.hotstring`.
   * @param ctx the parse tree
   */
  exitHotstring?: (ctx: HotstringContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.hotstringExpansion`.
   * @param ctx the parse tree
   */
  enterHotstringExpansion?: (ctx: HotstringExpansionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.hotstringExpansion`.
   * @param ctx the parse tree
   */
  exitHotstringExpansion?: (ctx: HotstringExpansionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.hotkey`.
   * @param ctx the parse tree
   */
  enterHotkey?: (ctx: HotkeyContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.hotkey`.
   * @param ctx the parse tree
   */
  exitHotkey?: (ctx: HotkeyContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.statement`.
   * @param ctx the parse tree
   */
  enterStatement?: (ctx: StatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.statement`.
   * @param ctx the parse tree
   */
  exitStatement?: (ctx: StatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.blockStatement`.
   * @param ctx the parse tree
   */
  enterBlockStatement?: (ctx: BlockStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.blockStatement`.
   * @param ctx the parse tree
   */
  exitBlockStatement?: (ctx: BlockStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.block`.
   * @param ctx the parse tree
   */
  enterBlock?: (ctx: BlockContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.block`.
   * @param ctx the parse tree
   */
  exitBlock?: (ctx: BlockContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.statementList`.
   * @param ctx the parse tree
   */
  enterStatementList?: (ctx: StatementListContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.statementList`.
   * @param ctx the parse tree
   */
  exitStatementList?: (ctx: StatementListContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.variableStatement`.
   * @param ctx the parse tree
   */
  enterVariableStatement?: (ctx: VariableStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.variableStatement`.
   * @param ctx the parse tree
   */
  exitVariableStatement?: (ctx: VariableStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.declaration`.
   * @param ctx the parse tree
   */
  enterDeclaration?: (ctx: DeclarationContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.declaration`.
   * @param ctx the parse tree
   */
  exitDeclaration?: (ctx: DeclarationContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.variableDeclarationList`.
   * @param ctx the parse tree
   */
  enterVariableDeclarationList?: (ctx: VariableDeclarationListContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.variableDeclarationList`.
   * @param ctx the parse tree
   */
  exitVariableDeclarationList?: (ctx: VariableDeclarationListContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.variableDeclaration`.
   * @param ctx the parse tree
   */
  enterVariableDeclaration?: (ctx: VariableDeclarationContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.variableDeclaration`.
   * @param ctx the parse tree
   */
  exitVariableDeclaration?: (ctx: VariableDeclarationContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionStatement`.
   * @param ctx the parse tree
   */
  enterFunctionStatement?: (ctx: FunctionStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionStatement`.
   * @param ctx the parse tree
   */
  exitFunctionStatement?: (ctx: FunctionStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.expressionStatement`.
   * @param ctx the parse tree
   */
  enterExpressionStatement?: (ctx: ExpressionStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.expressionStatement`.
   * @param ctx the parse tree
   */
  exitExpressionStatement?: (ctx: ExpressionStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.ifStatement`.
   * @param ctx the parse tree
   */
  enterIfStatement?: (ctx: IfStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.ifStatement`.
   * @param ctx the parse tree
   */
  exitIfStatement?: (ctx: IfStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.flowBlock`.
   * @param ctx the parse tree
   */
  enterFlowBlock?: (ctx: FlowBlockContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.flowBlock`.
   * @param ctx the parse tree
   */
  exitFlowBlock?: (ctx: FlowBlockContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.untilProduction`.
   * @param ctx the parse tree
   */
  enterUntilProduction?: (ctx: UntilProductionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.untilProduction`.
   * @param ctx the parse tree
   */
  exitUntilProduction?: (ctx: UntilProductionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.elseProduction`.
   * @param ctx the parse tree
   */
  enterElseProduction?: (ctx: ElseProductionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.elseProduction`.
   * @param ctx the parse tree
   */
  exitElseProduction?: (ctx: ElseProductionContext) => void;
  /**
   * Enter a parse tree produced by the `SpecializedLoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  enterSpecializedLoopStatement?: (ctx: SpecializedLoopStatementContext) => void;
  /**
   * Exit a parse tree produced by the `SpecializedLoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  exitSpecializedLoopStatement?: (ctx: SpecializedLoopStatementContext) => void;
  /**
   * Enter a parse tree produced by the `LoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  enterLoopStatement?: (ctx: LoopStatementContext) => void;
  /**
   * Exit a parse tree produced by the `LoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  exitLoopStatement?: (ctx: LoopStatementContext) => void;
  /**
   * Enter a parse tree produced by the `WhileStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  enterWhileStatement?: (ctx: WhileStatementContext) => void;
  /**
   * Exit a parse tree produced by the `WhileStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  exitWhileStatement?: (ctx: WhileStatementContext) => void;
  /**
   * Enter a parse tree produced by the `ForInStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  enterForInStatement?: (ctx: ForInStatementContext) => void;
  /**
   * Exit a parse tree produced by the `ForInStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   */
  exitForInStatement?: (ctx: ForInStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.forInParameters`.
   * @param ctx the parse tree
   */
  enterForInParameters?: (ctx: ForInParametersContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.forInParameters`.
   * @param ctx the parse tree
   */
  exitForInParameters?: (ctx: ForInParametersContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.continueStatement`.
   * @param ctx the parse tree
   */
  enterContinueStatement?: (ctx: ContinueStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.continueStatement`.
   * @param ctx the parse tree
   */
  exitContinueStatement?: (ctx: ContinueStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.breakStatement`.
   * @param ctx the parse tree
   */
  enterBreakStatement?: (ctx: BreakStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.breakStatement`.
   * @param ctx the parse tree
   */
  exitBreakStatement?: (ctx: BreakStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.returnStatement`.
   * @param ctx the parse tree
   */
  enterReturnStatement?: (ctx: ReturnStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.returnStatement`.
   * @param ctx the parse tree
   */
  exitReturnStatement?: (ctx: ReturnStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.switchStatement`.
   * @param ctx the parse tree
   */
  enterSwitchStatement?: (ctx: SwitchStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.switchStatement`.
   * @param ctx the parse tree
   */
  exitSwitchStatement?: (ctx: SwitchStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.caseBlock`.
   * @param ctx the parse tree
   */
  enterCaseBlock?: (ctx: CaseBlockContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.caseBlock`.
   * @param ctx the parse tree
   */
  exitCaseBlock?: (ctx: CaseBlockContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.caseClause`.
   * @param ctx the parse tree
   */
  enterCaseClause?: (ctx: CaseClauseContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.caseClause`.
   * @param ctx the parse tree
   */
  exitCaseClause?: (ctx: CaseClauseContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.labelledStatement`.
   * @param ctx the parse tree
   */
  enterLabelledStatement?: (ctx: LabelledStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.labelledStatement`.
   * @param ctx the parse tree
   */
  exitLabelledStatement?: (ctx: LabelledStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.gotoStatement`.
   * @param ctx the parse tree
   */
  enterGotoStatement?: (ctx: GotoStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.gotoStatement`.
   * @param ctx the parse tree
   */
  exitGotoStatement?: (ctx: GotoStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.throwStatement`.
   * @param ctx the parse tree
   */
  enterThrowStatement?: (ctx: ThrowStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.throwStatement`.
   * @param ctx the parse tree
   */
  exitThrowStatement?: (ctx: ThrowStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.tryStatement`.
   * @param ctx the parse tree
   */
  enterTryStatement?: (ctx: TryStatementContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.tryStatement`.
   * @param ctx the parse tree
   */
  exitTryStatement?: (ctx: TryStatementContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.catchProduction`.
   * @param ctx the parse tree
   */
  enterCatchProduction?: (ctx: CatchProductionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.catchProduction`.
   * @param ctx the parse tree
   */
  exitCatchProduction?: (ctx: CatchProductionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.catchAssignable`.
   * @param ctx the parse tree
   */
  enterCatchAssignable?: (ctx: CatchAssignableContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.catchAssignable`.
   * @param ctx the parse tree
   */
  exitCatchAssignable?: (ctx: CatchAssignableContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.catchClasses`.
   * @param ctx the parse tree
   */
  enterCatchClasses?: (ctx: CatchClassesContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.catchClasses`.
   * @param ctx the parse tree
   */
  exitCatchClasses?: (ctx: CatchClassesContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.finallyProduction`.
   * @param ctx the parse tree
   */
  enterFinallyProduction?: (ctx: FinallyProductionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.finallyProduction`.
   * @param ctx the parse tree
   */
  exitFinallyProduction?: (ctx: FinallyProductionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionDeclaration`.
   * @param ctx the parse tree
   */
  enterFunctionDeclaration?: (ctx: FunctionDeclarationContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionDeclaration`.
   * @param ctx the parse tree
   */
  exitFunctionDeclaration?: (ctx: FunctionDeclarationContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.classDeclaration`.
   * @param ctx the parse tree
   */
  enterClassDeclaration?: (ctx: ClassDeclarationContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.classDeclaration`.
   * @param ctx the parse tree
   */
  exitClassDeclaration?: (ctx: ClassDeclarationContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.classExtensionName`.
   * @param ctx the parse tree
   */
  enterClassExtensionName?: (ctx: ClassExtensionNameContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.classExtensionName`.
   * @param ctx the parse tree
   */
  exitClassExtensionName?: (ctx: ClassExtensionNameContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.classTail`.
   * @param ctx the parse tree
   */
  enterClassTail?: (ctx: ClassTailContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.classTail`.
   * @param ctx the parse tree
   */
  exitClassTail?: (ctx: ClassTailContext) => void;
  /**
   * Enter a parse tree produced by the `ClassMethodDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  enterClassMethodDeclaration?: (ctx: ClassMethodDeclarationContext) => void;
  /**
   * Exit a parse tree produced by the `ClassMethodDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  exitClassMethodDeclaration?: (ctx: ClassMethodDeclarationContext) => void;
  /**
   * Enter a parse tree produced by the `ClassPropertyDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  enterClassPropertyDeclaration?: (ctx: ClassPropertyDeclarationContext) => void;
  /**
   * Exit a parse tree produced by the `ClassPropertyDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  exitClassPropertyDeclaration?: (ctx: ClassPropertyDeclarationContext) => void;
  /**
   * Enter a parse tree produced by the `ClassFieldDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  enterClassFieldDeclaration?: (ctx: ClassFieldDeclarationContext) => void;
  /**
   * Exit a parse tree produced by the `ClassFieldDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  exitClassFieldDeclaration?: (ctx: ClassFieldDeclarationContext) => void;
  /**
   * Enter a parse tree produced by the `NestedClassDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  enterNestedClassDeclaration?: (ctx: NestedClassDeclarationContext) => void;
  /**
   * Exit a parse tree produced by the `NestedClassDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   */
  exitNestedClassDeclaration?: (ctx: NestedClassDeclarationContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.methodDefinition`.
   * @param ctx the parse tree
   */
  enterMethodDefinition?: (ctx: MethodDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.methodDefinition`.
   * @param ctx the parse tree
   */
  exitMethodDefinition?: (ctx: MethodDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.propertyDefinition`.
   * @param ctx the parse tree
   */
  enterPropertyDefinition?: (ctx: PropertyDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.propertyDefinition`.
   * @param ctx the parse tree
   */
  exitPropertyDefinition?: (ctx: PropertyDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.classPropertyName`.
   * @param ctx the parse tree
   */
  enterClassPropertyName?: (ctx: ClassPropertyNameContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.classPropertyName`.
   * @param ctx the parse tree
   */
  exitClassPropertyName?: (ctx: ClassPropertyNameContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.propertyGetterDefinition`.
   * @param ctx the parse tree
   */
  enterPropertyGetterDefinition?: (ctx: PropertyGetterDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.propertyGetterDefinition`.
   * @param ctx the parse tree
   */
  exitPropertyGetterDefinition?: (ctx: PropertyGetterDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.propertySetterDefinition`.
   * @param ctx the parse tree
   */
  enterPropertySetterDefinition?: (ctx: PropertySetterDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.propertySetterDefinition`.
   * @param ctx the parse tree
   */
  exitPropertySetterDefinition?: (ctx: PropertySetterDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.fieldDefinition`.
   * @param ctx the parse tree
   */
  enterFieldDefinition?: (ctx: FieldDefinitionContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.fieldDefinition`.
   * @param ctx the parse tree
   */
  exitFieldDefinition?: (ctx: FieldDefinitionContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.formalParameterList`.
   * @param ctx the parse tree
   */
  enterFormalParameterList?: (ctx: FormalParameterListContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.formalParameterList`.
   * @param ctx the parse tree
   */
  exitFormalParameterList?: (ctx: FormalParameterListContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.formalParameterArg`.
   * @param ctx the parse tree
   */
  enterFormalParameterArg?: (ctx: FormalParameterArgContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.formalParameterArg`.
   * @param ctx the parse tree
   */
  exitFormalParameterArg?: (ctx: FormalParameterArgContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.lastFormalParameterArg`.
   * @param ctx the parse tree
   */
  enterLastFormalParameterArg?: (ctx: LastFormalParameterArgContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.lastFormalParameterArg`.
   * @param ctx the parse tree
   */
  exitLastFormalParameterArg?: (ctx: LastFormalParameterArgContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.arrayLiteral`.
   * @param ctx the parse tree
   */
  enterArrayLiteral?: (ctx: ArrayLiteralContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.arrayLiteral`.
   * @param ctx the parse tree
   */
  exitArrayLiteral?: (ctx: ArrayLiteralContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.propertyAssignment`.
   * @param ctx the parse tree
   */
  enterPropertyAssignment?: (ctx: PropertyAssignmentContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.propertyAssignment`.
   * @param ctx the parse tree
   */
  exitPropertyAssignment?: (ctx: PropertyAssignmentContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.propertyName`.
   * @param ctx the parse tree
   */
  enterPropertyName?: (ctx: PropertyNameContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.propertyName`.
   * @param ctx the parse tree
   */
  exitPropertyName?: (ctx: PropertyNameContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.dereference`.
   * @param ctx the parse tree
   */
  enterDereference?: (ctx: DereferenceContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.dereference`.
   * @param ctx the parse tree
   */
  exitDereference?: (ctx: DereferenceContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.arguments`.
   * @param ctx the parse tree
   */
  enterArguments?: (ctx: ArgumentsContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.arguments`.
   * @param ctx the parse tree
   */
  exitArguments?: (ctx: ArgumentsContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.argument`.
   * @param ctx the parse tree
   */
  enterArgument?: (ctx: ArgumentContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.argument`.
   * @param ctx the parse tree
   */
  exitArgument?: (ctx: ArgumentContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.expressionSequence`.
   * @param ctx the parse tree
   */
  enterExpressionSequence?: (ctx: ExpressionSequenceContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.expressionSequence`.
   * @param ctx the parse tree
   */
  exitExpressionSequence?: (ctx: ExpressionSequenceContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.memberIndexArguments`.
   * @param ctx the parse tree
   */
  enterMemberIndexArguments?: (ctx: MemberIndexArgumentsContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.memberIndexArguments`.
   * @param ctx the parse tree
   */
  exitMemberIndexArguments?: (ctx: MemberIndexArgumentsContext) => void;
  /**
   * Enter a parse tree produced by the `PostIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterPostIncrementDecrementExpression?: (ctx: PostIncrementDecrementExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `PostIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitPostIncrementDecrementExpression?: (ctx: PostIncrementDecrementExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `AdditiveExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterAdditiveExpression?: (ctx: AdditiveExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `AdditiveExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitAdditiveExpression?: (ctx: AdditiveExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `RelationalExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterRelationalExpression?: (ctx: RelationalExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `RelationalExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitRelationalExpression?: (ctx: RelationalExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `TernaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterTernaryExpression?: (ctx: TernaryExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `TernaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitTernaryExpression?: (ctx: TernaryExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `PreIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterPreIncrementDecrementExpression?: (ctx: PreIncrementDecrementExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `PreIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitPreIncrementDecrementExpression?: (ctx: PreIncrementDecrementExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `LogicalAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterLogicalAndExpression?: (ctx: LogicalAndExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `LogicalAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitLogicalAndExpression?: (ctx: LogicalAndExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `PowerExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterPowerExpression?: (ctx: PowerExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `PowerExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitPowerExpression?: (ctx: PowerExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `FatArrowExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterFatArrowExpression?: (ctx: FatArrowExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `FatArrowExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitFatArrowExpression?: (ctx: FatArrowExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `LogicalOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterLogicalOrExpression?: (ctx: LogicalOrExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `LogicalOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitLogicalOrExpression?: (ctx: LogicalOrExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `UnaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterUnaryExpression?: (ctx: UnaryExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `UnaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitUnaryExpression?: (ctx: UnaryExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `AtomExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterAtomExpression?: (ctx: AtomExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `AtomExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitAtomExpression?: (ctx: AtomExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `RegExMatchExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterRegExMatchExpression?: (ctx: RegExMatchExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `RegExMatchExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitRegExMatchExpression?: (ctx: RegExMatchExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `IsExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterIsExpression?: (ctx: IsExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `IsExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitIsExpression?: (ctx: IsExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `AssignmentExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterAssignmentExpression?: (ctx: AssignmentExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `AssignmentExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitAssignmentExpression?: (ctx: AssignmentExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `BitAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterBitAndExpression?: (ctx: BitAndExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `BitAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitBitAndExpression?: (ctx: BitAndExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `BitOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterBitOrExpression?: (ctx: BitOrExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `BitOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitBitOrExpression?: (ctx: BitOrExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `ConcatenateExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterConcatenateExpression?: (ctx: ConcatenateExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `ConcatenateExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitConcatenateExpression?: (ctx: ConcatenateExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `BitXOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterBitXOrExpression?: (ctx: BitXOrExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `BitXOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitBitXOrExpression?: (ctx: BitXOrExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `EqualityExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterEqualityExpression?: (ctx: EqualityExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `EqualityExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitEqualityExpression?: (ctx: EqualityExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `VerbalNotExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterVerbalNotExpression?: (ctx: VerbalNotExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `VerbalNotExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitVerbalNotExpression?: (ctx: VerbalNotExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `MultiplicativeExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterMultiplicativeExpression?: (ctx: MultiplicativeExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `MultiplicativeExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitMultiplicativeExpression?: (ctx: MultiplicativeExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `CoalesceExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterCoalesceExpression?: (ctx: CoalesceExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `CoalesceExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitCoalesceExpression?: (ctx: CoalesceExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `BitShiftExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  enterBitShiftExpression?: (ctx: BitShiftExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `BitShiftExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   */
  exitBitShiftExpression?: (ctx: BitShiftExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `ParenthesizedExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `ParenthesizedExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `ObjectLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterObjectLiteralExpression?: (ctx: ObjectLiteralExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `ObjectLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitObjectLiteralExpression?: (ctx: ObjectLiteralExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `VarRefExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterVarRefExpression?: (ctx: VarRefExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `VarRefExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitVarRefExpression?: (ctx: VarRefExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `DynamicIdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterDynamicIdentifierExpression?: (ctx: DynamicIdentifierExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `DynamicIdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitDynamicIdentifierExpression?: (ctx: DynamicIdentifierExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `LiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterLiteralExpression?: (ctx: LiteralExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `LiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitLiteralExpression?: (ctx: LiteralExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `ArrayLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterArrayLiteralExpression?: (ctx: ArrayLiteralExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `ArrayLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitArrayLiteralExpression?: (ctx: ArrayLiteralExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `AccessExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterAccessExpression?: (ctx: AccessExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `AccessExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitAccessExpression?: (ctx: AccessExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `IdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  enterIdentifierExpression?: (ctx: IdentifierExpressionContext) => void;
  /**
   * Exit a parse tree produced by the `IdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   */
  exitIdentifierExpression?: (ctx: IdentifierExpressionContext) => void;
  /**
   * Enter a parse tree produced by the `MemberAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  enterMemberAccess?: (ctx: MemberAccessContext) => void;
  /**
   * Exit a parse tree produced by the `MemberAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  exitMemberAccess?: (ctx: MemberAccessContext) => void;
  /**
   * Enter a parse tree produced by the `IndexAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  enterIndexAccess?: (ctx: IndexAccessContext) => void;
  /**
   * Exit a parse tree produced by the `IndexAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  exitIndexAccess?: (ctx: IndexAccessContext) => void;
  /**
   * Enter a parse tree produced by the `FunctionCallAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  enterFunctionCallAccess?: (ctx: FunctionCallAccessContext) => void;
  /**
   * Exit a parse tree produced by the `FunctionCallAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  exitFunctionCallAccess?: (ctx: FunctionCallAccessContext) => void;
  /**
   * Enter a parse tree produced by the `AllowUnsetAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  enterAllowUnsetAccess?: (ctx: AllowUnsetAccessContext) => void;
  /**
   * Exit a parse tree produced by the `AllowUnsetAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   */
  exitAllowUnsetAccess?: (ctx: AllowUnsetAccessContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.memberDot`.
   * @param ctx the parse tree
   */
  enterMemberDot?: (ctx: MemberDotContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.memberDot`.
   * @param ctx the parse tree
   */
  exitMemberDot?: (ctx: MemberDotContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.memberIdentifier`.
   * @param ctx the parse tree
   */
  enterMemberIdentifier?: (ctx: MemberIdentifierContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.memberIdentifier`.
   * @param ctx the parse tree
   */
  exitMemberIdentifier?: (ctx: MemberIdentifierContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.dynamicIdentifier`.
   * @param ctx the parse tree
   */
  enterDynamicIdentifier?: (ctx: DynamicIdentifierContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.dynamicIdentifier`.
   * @param ctx the parse tree
   */
  exitDynamicIdentifier?: (ctx: DynamicIdentifierContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.initializer`.
   * @param ctx the parse tree
   */
  enterInitializer?: (ctx: InitializerContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.initializer`.
   * @param ctx the parse tree
   */
  exitInitializer?: (ctx: InitializerContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.assignable`.
   * @param ctx the parse tree
   */
  enterAssignable?: (ctx: AssignableContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.assignable`.
   * @param ctx the parse tree
   */
  exitAssignable?: (ctx: AssignableContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.objectLiteral`.
   * @param ctx the parse tree
   */
  enterObjectLiteral?: (ctx: ObjectLiteralContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.objectLiteral`.
   * @param ctx the parse tree
   */
  exitObjectLiteral?: (ctx: ObjectLiteralContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionHead`.
   * @param ctx the parse tree
   */
  enterFunctionHead?: (ctx: FunctionHeadContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionHead`.
   * @param ctx the parse tree
   */
  exitFunctionHead?: (ctx: FunctionHeadContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionHeadPrefix`.
   * @param ctx the parse tree
   */
  enterFunctionHeadPrefix?: (ctx: FunctionHeadPrefixContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionHeadPrefix`.
   * @param ctx the parse tree
   */
  exitFunctionHeadPrefix?: (ctx: FunctionHeadPrefixContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionExpressionHead`.
   * @param ctx the parse tree
   */
  enterFunctionExpressionHead?: (ctx: FunctionExpressionHeadContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionExpressionHead`.
   * @param ctx the parse tree
   */
  exitFunctionExpressionHead?: (ctx: FunctionExpressionHeadContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.fatArrowExpressionHead`.
   * @param ctx the parse tree
   */
  enterFatArrowExpressionHead?: (ctx: FatArrowExpressionHeadContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.fatArrowExpressionHead`.
   * @param ctx the parse tree
   */
  exitFatArrowExpressionHead?: (ctx: FatArrowExpressionHeadContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.functionBody`.
   * @param ctx the parse tree
   */
  enterFunctionBody?: (ctx: FunctionBodyContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.functionBody`.
   * @param ctx the parse tree
   */
  exitFunctionBody?: (ctx: FunctionBodyContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.assignmentOperator`.
   * @param ctx the parse tree
   */
  enterAssignmentOperator?: (ctx: AssignmentOperatorContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.assignmentOperator`.
   * @param ctx the parse tree
   */
  exitAssignmentOperator?: (ctx: AssignmentOperatorContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.literal`.
   * @param ctx the parse tree
   */
  enterLiteral?: (ctx: LiteralContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.literal`.
   * @param ctx the parse tree
   */
  exitLiteral?: (ctx: LiteralContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.boolean`.
   * @param ctx the parse tree
   */
  enterBoolean?: (ctx: BooleanContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.boolean`.
   * @param ctx the parse tree
   */
  exitBoolean?: (ctx: BooleanContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.numericLiteral`.
   * @param ctx the parse tree
   */
  enterNumericLiteral?: (ctx: NumericLiteralContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.numericLiteral`.
   * @param ctx the parse tree
   */
  exitNumericLiteral?: (ctx: NumericLiteralContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.getter`.
   * @param ctx the parse tree
   */
  enterGetter?: (ctx: GetterContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.getter`.
   * @param ctx the parse tree
   */
  exitGetter?: (ctx: GetterContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.setter`.
   * @param ctx the parse tree
   */
  enterSetter?: (ctx: SetterContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.setter`.
   * @param ctx the parse tree
   */
  exitSetter?: (ctx: SetterContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.identifierName`.
   * @param ctx the parse tree
   */
  enterIdentifierName?: (ctx: IdentifierNameContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.identifierName`.
   * @param ctx the parse tree
   */
  exitIdentifierName?: (ctx: IdentifierNameContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.identifier`.
   * @param ctx the parse tree
   */
  enterIdentifier?: (ctx: IdentifierContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.identifier`.
   * @param ctx the parse tree
   */
  exitIdentifier?: (ctx: IdentifierContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.reservedWord`.
   * @param ctx the parse tree
   */
  enterReservedWord?: (ctx: ReservedWordContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.reservedWord`.
   * @param ctx the parse tree
   */
  exitReservedWord?: (ctx: ReservedWordContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.keyword`.
   * @param ctx the parse tree
   */
  enterKeyword?: (ctx: KeywordContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.keyword`.
   * @param ctx the parse tree
   */
  exitKeyword?: (ctx: KeywordContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.s`.
   * @param ctx the parse tree
   */
  enterS?: (ctx: SContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.s`.
   * @param ctx the parse tree
   */
  exitS?: (ctx: SContext) => void;
  /**
   * Enter a parse tree produced by `AutoHotkeyParser.eos`.
   * @param ctx the parse tree
   */
  enterEos?: (ctx: EosContext) => void;
  /**
   * Exit a parse tree produced by `AutoHotkeyParser.eos`.
   * @param ctx the parse tree
   */
  exitEos?: (ctx: EosContext) => void;

  visitTerminal(node: TerminalNode): void {}
  visitErrorNode(node: ErrorNode): void {}
  enterEveryRule(node: ParserRuleContext): void {}
  exitEveryRule(node: ParserRuleContext): void {}
}
