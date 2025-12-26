// Generated from c:/Users/minip/source/repos/ahk2-antlr4-demo/src/grammar/AutoHotkeyParser.g4 by ANTLR 4.13.1

import { AbstractParseTreeVisitor } from 'antlr4ng';

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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `AutoHotkeyParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class AutoHotkeyParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.program`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitProgram?: (ctx: ProgramContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.sourceElements`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSourceElements?: (ctx: SourceElementsContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.sourceElement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSourceElement?: (ctx: SourceElementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.directive`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitDirective?: (ctx: DirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `HotIfDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitHotIfDirective?: (ctx: HotIfDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `HotstringDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitHotstringDirective?: (ctx: HotstringDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `InputLevelDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitInputLevelDirective?: (ctx: InputLevelDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `UseHookDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitUseHookDirective?: (ctx: UseHookDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `SuspendExemptDirective`
   * labeled alternative in `AutoHotkeyParser.positionalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSuspendExemptDirective?: (ctx: SuspendExemptDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `TextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitTextualDirective?: (ctx: TextualDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `PersistentDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPersistentDirective?: (ctx: PersistentDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `OptionalTextualDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitOptionalTextualDirective?: (ctx: OptionalTextualDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `SingleDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSingleDirective?: (ctx: SingleDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by the `NumericDirective`
   * labeled alternative in `AutoHotkeyParser.generalDirective`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitNumericDirective?: (ctx: NumericDirectiveContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.remap`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRemap?: (ctx: RemapContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.hotstring`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitHotstring?: (ctx: HotstringContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.hotstringExpansion`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitHotstringExpansion?: (ctx: HotstringExpansionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.hotkey`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitHotkey?: (ctx: HotkeyContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.statement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitStatement?: (ctx: StatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.blockStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBlockStatement?: (ctx: BlockStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.block`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBlock?: (ctx: BlockContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.statementList`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitStatementList?: (ctx: StatementListContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.variableStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitVariableStatement?: (ctx: VariableStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.declaration`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitDeclaration?: (ctx: DeclarationContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.variableDeclarationList`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitVariableDeclarationList?: (ctx: VariableDeclarationListContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.variableDeclaration`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitVariableDeclaration?: (ctx: VariableDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionStatement?: (ctx: FunctionStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.expressionStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitExpressionStatement?: (ctx: ExpressionStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.ifStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIfStatement?: (ctx: IfStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.flowBlock`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFlowBlock?: (ctx: FlowBlockContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.untilProduction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitUntilProduction?: (ctx: UntilProductionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.elseProduction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitElseProduction?: (ctx: ElseProductionContext) => Result;
  /**
   * Visit a parse tree produced by the `SpecializedLoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSpecializedLoopStatement?: (ctx: SpecializedLoopStatementContext) => Result;
  /**
   * Visit a parse tree produced by the `LoopStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLoopStatement?: (ctx: LoopStatementContext) => Result;
  /**
   * Visit a parse tree produced by the `WhileStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitWhileStatement?: (ctx: WhileStatementContext) => Result;
  /**
   * Visit a parse tree produced by the `ForInStatement`
   * labeled alternative in `AutoHotkeyParser.iterationStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitForInStatement?: (ctx: ForInStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.forInParameters`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitForInParameters?: (ctx: ForInParametersContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.continueStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitContinueStatement?: (ctx: ContinueStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.breakStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBreakStatement?: (ctx: BreakStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.returnStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitReturnStatement?: (ctx: ReturnStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.switchStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSwitchStatement?: (ctx: SwitchStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.caseBlock`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCaseBlock?: (ctx: CaseBlockContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.caseClause`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCaseClause?: (ctx: CaseClauseContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.labelledStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLabelledStatement?: (ctx: LabelledStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.gotoStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitGotoStatement?: (ctx: GotoStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.throwStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitThrowStatement?: (ctx: ThrowStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.tryStatement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitTryStatement?: (ctx: TryStatementContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.catchProduction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCatchProduction?: (ctx: CatchProductionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.catchAssignable`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCatchAssignable?: (ctx: CatchAssignableContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.catchClasses`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCatchClasses?: (ctx: CatchClassesContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.finallyProduction`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFinallyProduction?: (ctx: FinallyProductionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionDeclaration`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionDeclaration?: (ctx: FunctionDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.classDeclaration`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassDeclaration?: (ctx: ClassDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.classExtensionName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassExtensionName?: (ctx: ClassExtensionNameContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.classTail`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassTail?: (ctx: ClassTailContext) => Result;
  /**
   * Visit a parse tree produced by the `ClassMethodDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassMethodDeclaration?: (ctx: ClassMethodDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by the `ClassPropertyDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassPropertyDeclaration?: (ctx: ClassPropertyDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by the `ClassFieldDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassFieldDeclaration?: (ctx: ClassFieldDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by the `NestedClassDeclaration`
   * labeled alternative in `AutoHotkeyParser.classElement`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitNestedClassDeclaration?: (ctx: NestedClassDeclarationContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.methodDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMethodDefinition?: (ctx: MethodDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.propertyDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPropertyDefinition?: (ctx: PropertyDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.classPropertyName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitClassPropertyName?: (ctx: ClassPropertyNameContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.propertyGetterDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPropertyGetterDefinition?: (ctx: PropertyGetterDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.propertySetterDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPropertySetterDefinition?: (ctx: PropertySetterDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.fieldDefinition`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFieldDefinition?: (ctx: FieldDefinitionContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.formalParameterList`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFormalParameterList?: (ctx: FormalParameterListContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.formalParameterArg`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFormalParameterArg?: (ctx: FormalParameterArgContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.lastFormalParameterArg`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLastFormalParameterArg?: (ctx: LastFormalParameterArgContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.arrayLiteral`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitArrayLiteral?: (ctx: ArrayLiteralContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.propertyAssignment`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPropertyAssignment?: (ctx: PropertyAssignmentContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.propertyName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPropertyName?: (ctx: PropertyNameContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.dereference`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitDereference?: (ctx: DereferenceContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.arguments`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitArguments?: (ctx: ArgumentsContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.argument`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitArgument?: (ctx: ArgumentContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.expressionSequence`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitExpressionSequence?: (ctx: ExpressionSequenceContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.memberIndexArguments`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMemberIndexArguments?: (ctx: MemberIndexArgumentsContext) => Result;
  /**
   * Visit a parse tree produced by the `PostIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPostIncrementDecrementExpression?: (ctx: PostIncrementDecrementExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `AdditiveExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAdditiveExpression?: (ctx: AdditiveExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `RelationalExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRelationalExpression?: (ctx: RelationalExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `TernaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitTernaryExpression?: (ctx: TernaryExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `PreIncrementDecrementExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPreIncrementDecrementExpression?: (ctx: PreIncrementDecrementExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `LogicalAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLogicalAndExpression?: (ctx: LogicalAndExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `PowerExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitPowerExpression?: (ctx: PowerExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `FatArrowExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFatArrowExpression?: (ctx: FatArrowExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `LogicalOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLogicalOrExpression?: (ctx: LogicalOrExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `UnaryExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitUnaryExpression?: (ctx: UnaryExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `AtomExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAtomExpression?: (ctx: AtomExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `RegExMatchExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitRegExMatchExpression?: (ctx: RegExMatchExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `IsExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIsExpression?: (ctx: IsExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `AssignmentExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAssignmentExpression?: (ctx: AssignmentExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `BitAndExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBitAndExpression?: (ctx: BitAndExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `BitOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBitOrExpression?: (ctx: BitOrExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `ConcatenateExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitConcatenateExpression?: (ctx: ConcatenateExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `BitXOrExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBitXOrExpression?: (ctx: BitXOrExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `EqualityExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitEqualityExpression?: (ctx: EqualityExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `VerbalNotExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitVerbalNotExpression?: (ctx: VerbalNotExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `MultiplicativeExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMultiplicativeExpression?: (ctx: MultiplicativeExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `CoalesceExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitCoalesceExpression?: (ctx: CoalesceExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `BitShiftExpression`
   * labeled alternative in `AutoHotkeyParser.singleExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBitShiftExpression?: (ctx: BitShiftExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `ParenthesizedExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `ObjectLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitObjectLiteralExpression?: (ctx: ObjectLiteralExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `VarRefExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitVarRefExpression?: (ctx: VarRefExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `DynamicIdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitDynamicIdentifierExpression?: (ctx: DynamicIdentifierExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `LiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLiteralExpression?: (ctx: LiteralExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `ArrayLiteralExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitArrayLiteralExpression?: (ctx: ArrayLiteralExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `AccessExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAccessExpression?: (ctx: AccessExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `IdentifierExpression`
   * labeled alternative in `AutoHotkeyParser.primaryExpression`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIdentifierExpression?: (ctx: IdentifierExpressionContext) => Result;
  /**
   * Visit a parse tree produced by the `MemberAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMemberAccess?: (ctx: MemberAccessContext) => Result;
  /**
   * Visit a parse tree produced by the `IndexAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIndexAccess?: (ctx: IndexAccessContext) => Result;
  /**
   * Visit a parse tree produced by the `FunctionCallAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionCallAccess?: (ctx: FunctionCallAccessContext) => Result;
  /**
   * Visit a parse tree produced by the `AllowUnsetAccess`
   * labeled alternative in `AutoHotkeyParser.accessSuffix`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAllowUnsetAccess?: (ctx: AllowUnsetAccessContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.memberDot`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMemberDot?: (ctx: MemberDotContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.memberIdentifier`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitMemberIdentifier?: (ctx: MemberIdentifierContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.dynamicIdentifier`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitDynamicIdentifier?: (ctx: DynamicIdentifierContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.initializer`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitInitializer?: (ctx: InitializerContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.assignable`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAssignable?: (ctx: AssignableContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.objectLiteral`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitObjectLiteral?: (ctx: ObjectLiteralContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionHead`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionHead?: (ctx: FunctionHeadContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionHeadPrefix`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionHeadPrefix?: (ctx: FunctionHeadPrefixContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionExpressionHead`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionExpressionHead?: (ctx: FunctionExpressionHeadContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.fatArrowExpressionHead`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFatArrowExpressionHead?: (ctx: FatArrowExpressionHeadContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.functionBody`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitFunctionBody?: (ctx: FunctionBodyContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.assignmentOperator`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitAssignmentOperator?: (ctx: AssignmentOperatorContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.literal`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitLiteral?: (ctx: LiteralContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.boolean`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitBoolean?: (ctx: BooleanContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.numericLiteral`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitNumericLiteral?: (ctx: NumericLiteralContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.getter`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitGetter?: (ctx: GetterContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.setter`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitSetter?: (ctx: SetterContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.identifierName`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIdentifierName?: (ctx: IdentifierNameContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.identifier`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitIdentifier?: (ctx: IdentifierContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.reservedWord`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitReservedWord?: (ctx: ReservedWordContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.keyword`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitKeyword?: (ctx: KeywordContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.s`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitS?: (ctx: SContext) => Result;
  /**
   * Visit a parse tree produced by `AutoHotkeyParser.eos`.
   * @param ctx the parse tree
   * @return the visitor result
   */
  visitEos?: (ctx: EosContext) => Result;
}
