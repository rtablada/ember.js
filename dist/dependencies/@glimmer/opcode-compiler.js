import { $v0, $fp, $sp, isMachineOp, $s0, $s1 } from '@glimmer/vm';
import { isSmallInt, exhausted, EMPTY_ARRAY, assertNever, dict, assign, Stack, encodeImmediate, unreachable, encodeHandle, unwrapTemplate } from '@glimmer/util';
import { patchStdlibs, WriteOnlyConstants, HeapImpl, JitConstants } from '@glimmer/program';
import { InstructionEncoderImpl } from '@glimmer/encoder';

function arr(value) {
  return {
    type: 'array',
    value
  };
}

function strArray(value) {
  return {
    type: 'string-array',
    value
  };
}

function serializable(value) {
  return {
    type: 'serializable',
    value
  };
}

function templateMeta(value) {
  return {
    type: 'template-meta',
    value
  };
}

function other(value) {
  return {
    type: 'other',
    value
  };
}

function label(value) {
  return {
    type: 'label',
    value
  };
}

function immediate(value) {
  return {
    type: 'immediate',
    value
  };
}

function prim(value) {
  return {
    type: 'primitive',
    value
  };
}

const DEFAULT_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: true,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  dynamicScope: true,
  createCaller: false,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};
const MINIMAL_CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: false,
  attributeHook: false,
  elementHook: false,
  dynamicScope: false,
  createCaller: false,
  updateHook: false,
  createInstance: false,
  wrapped: false,
  willDestroy: false
};

class DefaultCompileTimeResolverDelegate {
  constructor(inner) {
    this.inner = inner;
  }

  lookupHelper(name, referrer) {
    if (this.inner.lookupHelper) {
      let helper = this.inner.lookupHelper(name, referrer);

      if (helper === undefined) {
        throw new Error(`Unexpected helper (${name} from ${JSON.stringify(referrer)}) (lookupHelper returned undefined)`);
      }

      return helper;
    } else {
      throw new Error(`Can't compile global helper invocations without an implementation of lookupHelper`);
    }
  }

  lookupModifier(name, referrer) {
    if (this.inner.lookupModifier) {
      let modifier = this.inner.lookupModifier(name, referrer);

      if (modifier === undefined) {
        throw new Error(`Unexpected modifier (${name} from ${JSON.stringify(referrer)}) (lookupModifier returned undefined)`);
      }

      return modifier;
    } else {
      throw new Error(`Can't compile global modifier invocations without an implementation of lookupModifier`);
    }
  }

  lookupComponent(name, referrer) {
    if (this.inner.lookupComponent) {
      let component = this.inner.lookupComponent(name, referrer);

      if (component === undefined) {
        throw new Error(`Unexpected component (${name} from ${JSON.stringify(referrer)}) (lookupComponent returned undefined)`);
      }

      return component;
    } else {
      throw new Error(`Can't compile global component invocations without an implementation of lookupComponent`);
    }
  }

  lookupPartial(name, referrer) {
    if (this.inner.lookupPartial) {
      let partial = this.inner.lookupPartial(name, referrer);

      if (partial === undefined) {
        throw new Error(`Unexpected partial (${name} from ${JSON.stringify(referrer)}) (lookupPartial returned undefined)`);
      }

      return partial;
    } else {
      throw new Error(`Can't compile global partial invocations without an implementation of lookupPartial`);
    }
  } // For debugging


  resolve(handle) {
    if (this.inner.resolve) {
      return this.inner.resolve(handle);
    } else {
      throw new Error(`Compile-time debugging requires an implementation of resolve`);
    }
  }

}

function resolveLayoutForTag(tag, {
  resolver,
  meta: {
    referrer
  }
}) {
  let component = resolver.lookupComponent(tag, referrer);
  if (component === null) return component;
  let {
    handle,
    compilable,
    capabilities
  } = component;
  return {
    handle,
    compilable,
    capabilities: capabilities || MINIMAL_CAPABILITIES
  };
}
/**
 * Push a reference onto the stack corresponding to a statically known primitive
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */


function PushPrimitiveReference(value) {
  return [PushPrimitive(value), op(31
  /* PrimitiveReference */
  )];
}
/**
 * Push an encoded representation of a JavaScript primitive on the stack
 *
 * @param value A JavaScript primitive (undefined, null, boolean, number or string)
 */


function PushPrimitive(primitive) {
  let p = typeof primitive === 'number' && isSmallInt(primitive) ? immediate(primitive) : prim(primitive);
  return op(30
  /* Primitive */
  , p);
}
/**
 * Invoke a foreign function (a "helper") based on a statically known handle
 *
 * @param compile.handle A handle
 * @param compile.params An optional list of expressions to compile
 * @param compile.hash An optional list of named arguments (name + expression) to compile
 */


function Call({
  handle,
  params,
  hash
}) {
  return [op(0
  /* PushFrame */
  ), op('SimpleArgs', {
    params,
    hash,
    atNames: false
  }), op(16
  /* Helper */
  , handle), op(1
  /* PopFrame */
  ), op(36
  /* Fetch */
  , $v0)];
}
/**
 * Evaluate statements in the context of new dynamic scope entries. Move entries from the
 * stack into named entries in the dynamic scope, then evaluate the statements, then pop
 * the dynamic scope
 *
 * @param names a list of dynamic scope names
 * @param block a function that returns a list of statements to evaluate
 */


function DynamicScope(names, block) {
  return [op(59
  /* PushDynamicScope */
  ), op(58
  /* BindDynamicScope */
  , strArray(names)), block(), op(60
  /* PopDynamicScope */
  )];
}
/**
 * Yield to a block located at a particular symbol location.
 *
 * @param to the symbol containing the block to yield to
 * @param params optional block parameters to yield to the block
 */


function YieldBlock(to, params) {
  return [op('SimpleArgs', {
    params,
    hash: null,
    atNames: true
  }), op(24
  /* GetBlock */
  , to), op(25
  /* JitSpreadBlock */
  ), op('Option', op('JitCompileBlock')), op(64
  /* InvokeYield */
  ), op(40
  /* PopScope */
  ), op(1
  /* PopFrame */
  )];
}
/**
 * Push an (optional) yieldable block onto the stack. The yieldable block must be known
 * statically at compile time.
 *
 * @param block An optional Compilable block
 */


function PushYieldableBlock(block) {
  return [PushSymbolTable(block && block.symbolTable), op(62
  /* PushBlockScope */
  ), op('PushCompilable', block)];
}
/**
 * Invoke a block that is known statically at compile time.
 *
 * @param block a Compilable block
 */


function InvokeStaticBlock(block) {
  return [op(0
  /* PushFrame */
  ), op('PushCompilable', block), op('JitCompileBlock'), op(2
  /* InvokeVirtual */
  ), op(1
  /* PopFrame */
  )];
}
/**
 * Invoke a static block, preserving some number of stack entries for use in
 * updating.
 *
 * @param block A compilable block
 * @param callerCount A number of stack entries to preserve
 */


function InvokeStaticBlockWithStack(block, callerCount) {
  let {
    parameters
  } = block.symbolTable;
  let calleeCount = parameters.length;
  let count = Math.min(callerCount, calleeCount);

  if (count === 0) {
    return InvokeStaticBlock(block);
  }

  let out = [];
  out.push(op(0
  /* PushFrame */
  ));

  if (count) {
    out.push(op(39
    /* ChildScope */
    ));

    for (let i = 0; i < count; i++) {
      out.push(op(33
      /* Dup */
      , $fp, callerCount - i));
      out.push(op(19
      /* SetVariable */
      , parameters[i]));
    }
  }

  out.push(op('PushCompilable', block));
  out.push(op('JitCompileBlock'));
  out.push(op(2
  /* InvokeVirtual */
  ));

  if (count) {
    out.push(op(40
    /* PopScope */
    ));
  }

  out.push(op(1
  /* PopFrame */
  ));
  return out;
}

function PushSymbolTable(table) {
  if (table) {
    return op(63
    /* PushSymbolTable */
    , serializable(table));
  } else {
    return PushPrimitive(null);
  }
}

function SwitchCases(callback) {
  // Setup the switch DSL
  let clauses = [];
  let count = 0;

  function when(match, callback) {
    clauses.push({
      match,
      callback,
      label: `CLAUSE${count++}`
    });
  } // Call the callback


  callback(when); // Emit the opcodes for the switch

  let out = [op(69
  /* Enter */
  , 2), op(68
  /* AssertSame */
  ), op(32
  /* ReifyU32 */
  ), op('StartLabels')]; // First, emit the jump opcodes. We don't need a jump for the last
  // opcode, since it bleeds directly into its clause.

  for (let clause of clauses.slice(0, -1)) {
    out.push(op(67
    /* JumpEq */
    , label(clause.label), clause.match));
  } // Enumerate the clauses in reverse order. Earlier matches will
  // require fewer checks.


  for (let i = clauses.length - 1; i >= 0; i--) {
    let clause = clauses[i];
    out.push(op('Label', clause.label), op(34
    /* Pop */
    , 2), clause.callback()); // The first match is special: it is placed directly before the END
    // label, so no additional jump is needed at the end of it.

    if (i !== 0) {
      out.push(op(4
      /* Jump */
      , label('END')));
    }
  }

  out.push(op('Label', 'END'), op('StopLabels'), op(70
  /* Exit */
  ));
  return out;
}
/**
 * A convenience for pushing some arguments on the stack and
 * running some code if the code needs to be re-executed during
 * updating execution if some of the arguments have changed.
 *
 * # Initial Execution
 *
 * The `args` function should push zero or more arguments onto
 * the stack and return the number of arguments pushed.
 *
 * The `body` function provides the instructions to execute both
 * during initial execution and during updating execution.
 *
 * Internally, this function starts by pushing a new frame, so
 * that the body can return and sets the return point ($ra) to
 * the ENDINITIAL label.
 *
 * It then executes the `args` function, which adds instructions
 * responsible for pushing the arguments for the block to the
 * stack. These arguments will be restored to the stack before
 * updating execution.
 *
 * Next, it adds the Enter opcode, which marks the current position
 * in the DOM, and remembers the current $pc (the next instruction)
 * as the first instruction to execute during updating execution.
 *
 * Next, it runs `body`, which adds the opcodes that should
 * execute both during initial execution and during updating execution.
 * If the `body` wishes to finish early, it should Jump to the
 * `FINALLY` label.
 *
 * Next, it adds the FINALLY label, followed by:
 *
 * - the Exit opcode, which finalizes the marked DOM started by the
 *   Enter opcode.
 * - the Return opcode, which returns to the current return point
 *   ($ra).
 *
 * Finally, it adds the ENDINITIAL label followed by the PopFrame
 * instruction, which restores $fp, $sp and $ra.
 *
 * # Updating Execution
 *
 * Updating execution for this `replayable` occurs if the `body` added an
 * assertion, via one of the `JumpIf`, `JumpUnless` or `AssertSame` opcodes.
 *
 * If, during updating executon, the assertion fails, the initial VM is
 * restored, and the stored arguments are pushed onto the stack. The DOM
 * between the starting and ending markers is cleared, and the VM's cursor
 * is set to the area just cleared.
 *
 * The return point ($ra) is set to -1, the exit instruction.
 *
 * Finally, the $pc is set to to the instruction saved off by the
 * Enter opcode during initial execution, and execution proceeds as
 * usual.
 *
 * The only difference is that when a `Return` instruction is
 * encountered, the program jumps to -1 rather than the END label,
 * and the PopFrame opcode is not needed.
 */


function Replayable({
  args: args$$1,
  body
}) {
  // Push the arguments onto the stack. The args() function
  // tells us how many stack elements to retain for re-execution
  // when updating.
  let {
    count,
    actions
  } = args$$1(); // Start a new label frame, to give END and RETURN
  // a unique meaning.

  return [op('StartLabels'), op(0
  /* PushFrame */
  ), // If the body invokes a block, its return will return to
  // END. Otherwise, the return in RETURN will return to END.
  op(6
  /* ReturnTo */
  , label('ENDINITIAL')), actions, // Start a new updating closure, remembering `count` elements
  // from the stack. Everything after this point, and before END,
  // will execute both initially and to update the block.
  //
  // The enter and exit opcodes also track the area of the DOM
  // associated with this block. If an assertion inside the block
  // fails (for example, the test value changes from true to false
  // in an #if), the DOM is cleared and the program is re-executed,
  // restoring `count` elements to the stack and executing the
  // instructions between the enter and exit.
  op(69
  /* Enter */
  , count), // Evaluate the body of the block. The body of the block may
  // return, which will jump execution to END during initial
  // execution, and exit the updating routine.
  body(), // All execution paths in the body should run the FINALLY once
  // they are done. It is executed both during initial execution
  // and during updating execution.
  op('Label', 'FINALLY'), // Finalize the DOM.
  op(70
  /* Exit */
  ), // In initial execution, this is a noop: it returns to the
  // immediately following opcode. In updating execution, this
  // exits the updating routine.
  op(5
  /* Return */
  ), // Cleanup code for the block. Runs on initial execution
  // but not on updating.
  op('Label', 'ENDINITIAL'), op(1
  /* PopFrame */
  ), op('StopLabels')];
}
/**
 * A specialized version of the `replayable` convenience that allows the
 * caller to provide different code based upon whether the item at
 * the top of the stack is true or false.
 *
 * As in `replayable`, the `ifTrue` and `ifFalse` code can invoke `return`.
 *
 * During the initial execution, a `return` will continue execution
 * in the cleanup code, which finalizes the current DOM block and pops
 * the current frame.
 *
 * During the updating execution, a `return` will exit the updating
 * routine, as it can reuse the DOM block and is always only a single
 * frame deep.
 */


function ReplayableIf({
  args: args$$1,
  ifTrue,
  ifFalse
}) {
  return Replayable({
    args: args$$1,
    body: () => {
      let out = [// If the conditional is false, jump to the ELSE label.
      op(66
      /* JumpUnless */
      , label('ELSE')), // Otherwise, execute the code associated with the true branch.
      ifTrue(), // We're done, so return. In the initial execution, this runs
      // the cleanup code. In the updating VM, it exits the updating
      // routine.
      op(4
      /* Jump */
      , label('FINALLY')), op('Label', 'ELSE')]; // If the conditional is false, and code associatied ith the
      // false branch was provided, execute it. If there was no code
      // associated with the false branch, jumping to the else statement
      // has no other behavior.

      if (ifFalse) {
        out.push(ifFalse());
      }

      return out;
    }
  });
}

function pushBuilderOp(context, op$$1) {
  let {
    encoder,
    syntax: {
      program: {
        mode,
        constants
      }
    }
  } = context;

  switch (op$$1.op) {
    case "Option"
    /* Option */
    :
      return concat(context, option$1(op$$1));

    case "Label"
    /* Label */
    :
      return encoder.label(op$$1.op1);

    case "StartLabels"
    /* StartLabels */
    :
      return encoder.startLabels();

    case "StopLabels"
    /* StopLabels */
    :
      return encoder.stopLabels();

    case "JitCompileBlock"
    /* JitCompileBlock */
    :
      return concat(context, jitCompileBlock(mode));

    case "GetComponentLayout"
    /* GetComponentLayout */
    :
      return encoder.push(constants, compileLayoutOpcode(mode), op$$1.op1);

    case "SetBlock"
    /* SetBlock */
    :
      return encoder.push(constants, setBlock(mode), op$$1.op1);

    default:
      return exhausted(op$$1);
  }
}

function option$1(op$$1) {
  let value = op$$1.op1;
  return value === null ? NONE : value;
}

function compileLayoutOpcode(mode) {
  return mode === "aot"
  /* aot */
  ? 94
  /* GetAotComponentLayout */
  : 95
  /* GetJitComponentLayout */
  ;
}

function jitCompileBlock(mode) {
  return mode === "jit"
  /* jit */
  ? op(61
  /* CompileBlock */
  ) : NONE;
}

function setBlock(mode) {
  return mode === "aot"
  /* aot */
  ? 20
  /* SetAotBlock */
  : 21
  /* SetJitBlock */
  ;
}

function pushCompileOp(context, action) {
  concatStatements(context, compileOp(context, action));
}

function compileOp(context, action) {
  switch (action.op) {
    case "CompileBlock"
    /* CompileBlock */
    :
      return CompileBlockOp(context, action);

    case "CompileInline"
    /* CompileInline */
    :
      return CompileInlineOp(context, action);

    case "InvokeStatic"
    /* InvokeStatic */
    :
      return InvokeStatic(context.syntax, action);

    case "Args"
    /* Args */
    :
      return CompileArgs(action.op1);

    case "PushCompilable"
    /* PushCompilable */
    :
      return PushCompilable(action.op1, context.syntax);

    case "DynamicComponent"
    /* DynamicComponent */
    :
      return DynamicComponent(context, action);

    case "IfResolvedComponent"
    /* IfResolvedComponent */
    :
      return IfResolvedComponent(context, action);

    default:
      return exhausted(action);
  }
}

function CompileBlockOp(context, op$$1) {
  return compileBlock(op$$1.op1, context);
}

function CompileInlineOp(context, op$$1) {
  let {
    inline,
    ifUnhandled
  } = op$$1.op1;
  let returned = compileInline(inline, context);

  if (isHandled(returned)) {
    return returned;
  } else {
    return ifUnhandled(inline);
  }
}

function InvokeStatic(context, action) {
  let compilable$$1 = action.op1;

  if (context.program.mode === "aot"
  /* aot */
  ) {
      let handle = compilable$$1.compile(context);

      if (typeof handle !== 'number') {
        return op('Error', {
          problem: 'Invalid block',
          start: 0,
          end: 0
        });
      } // If the handle for the invoked component is not yet known (for example,
      // because this is a recursive invocation and we're still compiling), push a
      // function that will produce the correct handle when the heap is
      // serialized.


      if (handle === PLACEHOLDER_HANDLE) {
        return op(3
        /* InvokeStatic */
        , () => compilable$$1.compile(context));
      } else {
        return op(3
        /* InvokeStatic */
        , handle);
      }
    } else {
    return [op(29
    /* Constant */
    , other(action.op1)), op(61
    /* CompileBlock */
    ), op(2
    /* InvokeVirtual */
    )];
  }
}

function DynamicComponent(context, action) {
  let {
    definition,
    attrs,
    params,
    args: args$$1,
    blocks,
    atNames
  } = action.op1;
  let attrsBlock = attrs && attrs.length > 0 ? compilableBlock(attrs, context.meta) : null;
  let compiled = Array.isArray(blocks) || blocks === null ? namedBlocks(blocks, context.meta) : blocks;
  return InvokeDynamicComponent(context.meta, {
    definition,
    attrs: attrsBlock,
    params,
    hash: args$$1,
    atNames,
    blocks: compiled
  });
}

function IfResolvedComponent(context, action) {
  let {
    name,
    attrs,
    blocks,
    staticTemplate,
    dynamicTemplate,
    orElse
  } = action.op1;
  let component = resolveLayoutForTag(name, {
    resolver: context.syntax.program.resolverDelegate,
    meta: context.meta
  });
  let {
    meta: meta$$1
  } = context;

  if (component !== null) {
    let {
      handle,
      capabilities,
      compilable: compilable$$1
    } = component;
    let attrsBlock = compilableBlock(attrs, meta$$1);
    let compilableBlocks = namedBlocks(blocks, meta$$1);

    if (compilable$$1 !== null) {
      return staticTemplate(handle, capabilities, compilable$$1, {
        attrs: attrsBlock,
        blocks: compilableBlocks
      });
    } else {
      return dynamicTemplate(handle, capabilities, {
        attrs: attrsBlock,
        blocks: compilableBlocks
      });
    }
  } else if (orElse) {
    return orElse();
  } else {
    throw new Error(`Compile Error: Cannot find component ${name}`);
  }
}

function PushCompilable(block, context) {
  if (block === null) {
    return PushPrimitive(null);
  } else if (context.program.mode === "aot"
  /* aot */
  ) {
      let compiled = block.compile(context);

      if (typeof compiled !== 'number') {
        return op('Error', {
          problem: 'Compile Error (TODO: thread better)',
          start: 0,
          end: 0
        });
      }

      return PushPrimitive(compiled);
    } else {
    return op(29
    /* Constant */
    , other(block));
  }
}

function pushOp(encoder, constants, op) {
  if (op.op3 !== undefined) {
    encoder.push(constants, op.op, op.op1, op.op2, op.op3);
  } else if (op.op2 !== undefined) {
    encoder.push(constants, op.op, op.op1, op.op2);
  } else if (op.op1 !== undefined) {
    encoder.push(constants, op.op, op.op1);
  } else {
    encoder.push(constants, op.op);
  }
}

class Compilers {
  constructor() {
    this.names = {};
    this.funcs = [];
  }

  add(name, func) {
    this.names[name] = this.funcs.push(func) - 1;
  }

  compile(sexp, meta) {
    let name = sexp[0];
    let index = this.names[name];
    let func = this.funcs[index];
    return func(sexp, meta);
  }

}

const EXPRESSIONS = new Compilers();
EXPRESSIONS.add(31
/* Concat */
, ([, parts]) => {
  let out = [];

  for (let part of parts) {
    out.push(op('Expr', part));
  }

  out.push(op(28
  /* Concat */
  , parts.length));
  return out;
});
EXPRESSIONS.add(30
/* Call */
, ([, name, params, hash], meta) => {
  // TODO: triage this in the WF compiler
  let start = 0;
  let offset = 0;

  if (isComponent(name, meta)) {
    if (!params || params.length === 0) {
      return op('Error', {
        problem: 'component helper requires at least one argument',
        start: start,
        end: start + offset
      });
    }

    let [definition, ...restArgs] = params;
    return curryComponent({
      definition,
      params: restArgs,
      hash,
      atNames: false
    }, meta.referrer);
  }

  let nameOrError = expectString(name, meta, 'Expected call head to be a string');

  if (typeof nameOrError !== 'string') {
    return nameOrError;
  }

  return op('IfResolved', {
    kind: "Helper"
    /* Helper */
    ,
    name: nameOrError,
    andThen: handle => Call({
      handle,
      params,
      hash
    }),
    span: {
      start,
      end: start + offset
    }
  });
});

function isGetContextualFree(opcode) {
  return opcode[0] >= 34
  /* GetContextualFreeStart */
  ;
}

function isComponent(expr, meta) {
  if (!Array.isArray(expr)) {
    return false;
  }

  if (isGetContextualFree(expr)) {
    let head = expr[1];

    if (meta.upvars && meta.upvars[head] === 'component') {
      return true;
    } else {
      return false;
    }
  }

  return false;
}

EXPRESSIONS.add(32
/* GetSymbol */
, ([, sym, path]) => withPath(op(22
/* GetVariable */
, sym), path));
EXPRESSIONS.add(33
/* GetFree */
, ([, sym, path]) => withPath(op('ResolveFree', sym), path));
EXPRESSIONS.add(34
/* GetFreeInAppendSingleId */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 0
  /* AppendSingleId */

}), path));
EXPRESSIONS.add(35
/* GetFreeInExpression */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 1
  /* Expression */

}), path));
EXPRESSIONS.add(36
/* GetFreeInCallHead */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 2
  /* CallHead */

}), path));
EXPRESSIONS.add(37
/* GetFreeInBlockHead */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 3
  /* BlockHead */

}), path));
EXPRESSIONS.add(38
/* GetFreeInModifierHead */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 4
  /* ModifierHead */

}), path));
EXPRESSIONS.add(39
/* GetFreeInComponentHead */
, ([, sym, path]) => withPath(op('ResolveContextualFree', {
  freeVar: sym,
  context: 5
  /* ComponentHead */

}), path));

function withPath(expr, path) {
  if (path === undefined || path.length === 0) return expr;
  if (!Array.isArray(expr)) expr = [expr];

  for (let i = 0; i < path.length; i++) {
    expr.push(op(23
    /* GetProperty */
    , path[i]));
  }

  return expr;
}

EXPRESSIONS.add(29
/* Undefined */
, () => PushPrimitiveReference(undefined));
EXPRESSIONS.add(27
/* HasBlock */
, ([, block]) => {
  return [op('Expr', block), op(26
  /* HasBlock */
  )];
});
EXPRESSIONS.add(28
/* HasBlockParams */
, ([, block]) => [op('Expr', block), op(25
/* JitSpreadBlock */
), op('JitCompileBlock'), op(27
/* HasBlockParams */
)]);

function pushResolutionOp(encoder, context, operation, constants) {
  switch (operation.op) {
    case "SimpleArgs"
    /* SimpleArgs */
    :
      concatExpressions(encoder, context, compileSimpleArgs(operation.op1.params, operation.op1.hash, operation.op1.atNames), constants);
      break;

    case "Expr"
    /* Expr */
    :
      concatExpressions(encoder, context, expr(operation.op1, context.meta), constants);
      break;

    case "IfResolved"
    /* IfResolved */
    :
      {
        concatExpressions(encoder, context, ifResolved(context, operation), constants);
        break;
      }

    case "ResolveFree"
    /* ResolveFree */
    :
      {
        throw new Error('Unimplemented HighLevelResolutionOpcode.ResolveFree');
      }

    case "ResolveContextualFree"
    /* ResolveContextualFree */
    :
      {
        let {
          freeVar,
          context: expressionContext
        } = operation.op1;

        if (context.meta.asPartial) {
          let name = context.meta.upvars[freeVar];
          concatExpressions(encoder, context, [op(105
          /* ResolveMaybeLocal */
          , name)], constants);
          break;
        }

        switch (expressionContext) {
          case 1
          /* Expression */
          :
            {
              // in classic mode, this is always a this-fallback
              let name = context.meta.upvars[freeVar];
              concatExpressions(encoder, context, [op(22
              /* GetVariable */
              , 0), op(23
              /* GetProperty */
              , name)], constants);
              break;
            }

          case 0
          /* AppendSingleId */
          :
            {
              let resolver = context.syntax.program.resolverDelegate;
              let name = context.meta.upvars[freeVar];
              let resolvedHelper = resolver.lookupHelper(name, context.meta.referrer);
              let expressions;

              if (resolvedHelper) {
                expressions = Call({
                  handle: resolvedHelper,
                  params: null,
                  hash: null
                });
              } else {
                // in classic mode, this is always a this-fallback
                expressions = [op(22
                /* GetVariable */
                , 0), op(23
                /* GetProperty */
                , name)];
              }

              concatExpressions(encoder, context, expressions, constants);
              break;
            }

          default:
            throw new Error(`unimplemented: Can't evaluate expression in context ${expressionContext}`);
        }

        break;
      }

    default:
      return exhausted(operation);
  }
}

function expr(expression$$1, meta$$1) {
  if (Array.isArray(expression$$1)) {
    return EXPRESSIONS.compile(expression$$1, meta$$1);
  } else {
    return [PushPrimitive(expression$$1), op(31
    /* PrimitiveReference */
    )];
  }
}

function compileSimpleArgs(params, hash, atNames) {
  let out = [];
  let {
    count,
    actions
  } = CompilePositional(params);
  out.push(actions);
  let flags = count << 4;
  if (atNames) flags |= 0b1000;
  let names = EMPTY_ARRAY;

  if (hash) {
    names = hash[0];
    let val = hash[1];

    for (let i = 0; i < val.length; i++) {
      out.push(op('Expr', val[i]));
    }
  }

  out.push(op(84
  /* PushArgs */
  , strArray(names), strArray(EMPTY_ARRAY), flags));
  return out;
}

function ifResolved(context, {
  op1
}) {
  let {
    kind,
    name,
    andThen,
    orElse,
    span
  } = op1;
  let resolved = resolve(context.syntax.program.resolverDelegate, kind, name, context.meta.referrer);

  if (resolved !== null) {
    return andThen(resolved);
  } else if (orElse) {
    return orElse();
  } else {
    return error(`Unexpected ${kind} ${name}`, span.start, span.end);
  }
}

function resolve(resolver, kind, name, referrer) {
  switch (kind) {
    case "Modifier"
    /* Modifier */
    :
      return resolver.lookupModifier(name, referrer);

    case "Helper"
    /* Helper */
    :
      return resolver.lookupHelper(name, referrer);

    case "ComponentDefinition"
    /* ComponentDefinition */
    :
      {
        let component = resolver.lookupComponent(name, referrer);
        return component && component.handle;
      }
  }
}

const NONE = {
  'no-action': true
};
const UNHANDLED = {
  'not-handled': true
};

function isNoAction(actions) {
  return actions && !!actions['no-action'];
}

function isHandled(actions) {
  return !actions || !actions['not-handled'];
}

function concat(context, action) {
  if (isNoAction(action)) {
    return;
  } else if (Array.isArray(action)) {
    for (let item of action) {
      concat(context, item);
    }
  } else if (action.type === 'Simple') {
    pushBuilderOp(context, action);
  } else {
    pushOp(context.encoder, context.syntax.program.constants, action);
  }
}

function concatExpressions(encoder, context, action, constants) {
  if (isNoAction(action)) {
    return;
  } else if (Array.isArray(action)) {
    for (let item of action) {
      concatExpressions(encoder, context, item, constants);
    }
  } else if (action.type === 'Number') {
    pushOp(encoder, constants, action);
  } else if (action.type === 'Resolution') {
    pushResolutionOp(encoder, context, action, constants);
  } else if (action.type === 'Simple') {
    pushBuilderOp(context, action);
  } else if (action.type === 'Error') {
    encoder.error({
      problem: action.op1.problem,
      span: {
        start: action.op1.start,
        end: action.op1.end
      }
    });
  } else {
    throw assertNever(action, 'unexpected action kind');
  }
}

function concatStatements(context, action) {
  if (isNoAction(action)) {
    return;
  } else if (Array.isArray(action)) {
    for (let item of action) {
      concatStatements(context, item);
    }
  } else if (action.type === 'Number') {
    pushOp(context.encoder, context.syntax.program.constants, action);
  } else {
    if (action.type === 'Compile') {
      pushCompileOp(context, action);
    } else if (action.type === 'Resolution') {
      pushResolutionOp(context.encoder, context, action, context.syntax.program.constants);
    } else if (action.type === 'Simple') {
      pushBuilderOp(context, action);
    } else if (action.type === 'Error') {} else {
      throw assertNever(action, `unexpected action type`);
    }
  }
}

function populateBuiltins(blocks, inlines) {
  blocks.add('if', (params, _hash, blocks) => {
    if (!params || params.length !== 1) {
      throw new Error(`SYNTAX ERROR: #if requires a single argument`);
    }

    return ReplayableIf({
      args() {
        return {
          count: 1,
          actions: [op('Expr', params[0]), op(71
          /* ToBoolean */
          )]
        };
      },

      ifTrue() {
        return InvokeStaticBlock(blocks.get('default'));
      },

      ifFalse() {
        if (blocks.has('else')) {
          return InvokeStaticBlock(blocks.get('else'));
        } else {
          return NONE;
        }
      }

    });
  });
  blocks.add('unless', (params, _hash, blocks) => {
    if (!params || params.length !== 1) {
      throw new Error(`SYNTAX ERROR: #unless requires a single argument`);
    }

    return ReplayableIf({
      args() {
        return {
          count: 1,
          actions: [op('Expr', params[0]), op(71
          /* ToBoolean */
          )]
        };
      },

      ifTrue() {
        if (blocks.has('else')) {
          return InvokeStaticBlock(blocks.get('else'));
        } else {
          return NONE;
        }
      },

      ifFalse() {
        return InvokeStaticBlock(blocks.get('default'));
      }

    });
  });
  blocks.add('with', (params, _hash, blocks) => {
    if (!params || params.length !== 1) {
      throw new Error(`SYNTAX ERROR: #with requires a single argument`);
    }

    return ReplayableIf({
      args() {
        return {
          count: 2,
          actions: [op('Expr', params[0]), op(33
          /* Dup */
          , $sp, 0), op(71
          /* ToBoolean */
          )]
        };
      },

      ifTrue() {
        return InvokeStaticBlockWithStack(blocks.get('default'), 1);
      },

      ifFalse() {
        if (blocks.has('else')) {
          return InvokeStaticBlock(blocks.get('else'));
        } else {
          return NONE;
        }
      }

    });
  });
  blocks.add('let', (params, _hash, blocks) => {
    if (!params) {
      return error('let requires arguments', 0, 0);
    }

    let {
      count,
      actions
    } = CompilePositional(params);
    return [actions, InvokeStaticBlockWithStack(blocks.get('default'), count)];
  });
  blocks.add('each', (params, hash, blocks) => {
    return Replayable({
      args() {
        let actions;

        if (hash && hash[0][0] === 'key') {
          actions = [op('Expr', hash[1][0])];
        } else {
          actions = [PushPrimitiveReference(null)];
        }

        actions.push(op('Expr', params[0]));
        return {
          count: 2,
          actions
        };
      },

      body() {
        let out = [op(74
        /* PutIterator */
        ), op(66
        /* JumpUnless */
        , label('ELSE')), op(0
        /* PushFrame */
        ), op(33
        /* Dup */
        , $fp, 1), op(6
        /* ReturnTo */
        , label('ITER')), op(72
        /* EnterList */
        , label('BODY')), op('Label', 'ITER'), op(75
        /* Iterate */
        , label('BREAK')), op('Label', 'BODY'), InvokeStaticBlockWithStack(blocks.get('default'), 2), op(34
        /* Pop */
        , 2), op(4
        /* Jump */
        , label('FINALLY')), op('Label', 'BREAK'), op(73
        /* ExitList */
        ), op(1
        /* PopFrame */
        ), op(4
        /* Jump */
        , label('FINALLY')), op('Label', 'ELSE')];

        if (blocks.has('else')) {
          out.push(InvokeStaticBlock(blocks.get('else')));
        }

        return out;
      }

    });
  });
  blocks.add('in-element', (params, hash, blocks) => {
    if (!params || params.length !== 1) {
      throw new Error(`SYNTAX ERROR: #in-element requires a single argument`);
    }

    return ReplayableIf({
      args() {
        let [keys, values] = hash;
        let actions = [];

        for (let i = 0; i < keys.length; i++) {
          let key = keys[i];

          if (key === 'guid' || key === 'insertBefore') {
            actions.push(op('Expr', values[i]));
          } else {
            throw new Error(`SYNTAX ERROR: #in-element does not take a \`${keys[0]}\` option`);
          }
        }

        actions.push(op('Expr', params[0]), op(33
        /* Dup */
        , $sp, 0));
        return {
          count: 4,
          actions
        };
      },

      ifTrue() {
        return [op(50
        /* PushRemoteElement */
        ), InvokeStaticBlock(blocks.get('default')), op(56
        /* PopRemoteElement */
        )];
      }

    });
  });
  blocks.add('-with-dynamic-vars', (_params, hash, blocks) => {
    if (hash) {
      let [names, expressions] = hash;
      let {
        actions
      } = CompilePositional(expressions);
      return [actions, DynamicScope(names, () => {
        return InvokeStaticBlock(blocks.get('default'));
      })];
    } else {
      return InvokeStaticBlock(blocks.get('default'));
    }
  });
  blocks.add('component', (_params, hash, blocks, context) => {
    let tag = _params[0];

    if (typeof tag === 'string') {
      let returned = StaticComponentHelper(context, _params[0], hash, blocks.get('default'));
      if (isHandled(returned)) return returned;
    }

    let [definition, ...params] = _params;
    return op('DynamicComponent', {
      definition,
      attrs: null,
      params,
      args: hash,
      atNames: false,
      blocks
    });
  });
  inlines.add('component', (_name, _params, hash, context) => {
    let tag = _params && _params[0];

    if (typeof tag === 'string') {
      let returned = StaticComponentHelper(context, tag, hash, null);
      if (returned !== UNHANDLED) return returned;
    }

    let [definition, ...params] = _params;
    return InvokeDynamicComponent(context.meta, {
      definition,
      attrs: null,
      params,
      hash,
      atNames: false,
      blocks: EMPTY_BLOCKS
    });
  });
  return {
    blocks,
    inlines
  };
}

class MacrosImpl {
  constructor() {
    let {
      blocks,
      inlines
    } = populateBuiltins(new Blocks(), new Inlines());
    this.blocks = blocks;
    this.inlines = inlines;
  }

}

class Blocks {
  constructor() {
    this.names = dict();
    this.funcs = [];
  }

  add(name, func) {
    this.funcs.push(func);
    this.names[name] = this.funcs.length - 1;
  }

  addMissing(func) {
    this.missing = func;
  }

  compile(name, params, hash, blocks, context) {
    let index = this.names[name];
    let macroContext = {
      resolver: context.syntax.program.resolverDelegate,
      meta: context.meta
    };

    if (index === undefined) {
      let func = this.missing;
      let handled = func(name, params, hash, blocks, macroContext);
      return handled;
    } else {
      let func = this.funcs[index];
      return func(params, hash, blocks, macroContext);
    }
  }

}

class Inlines {
  constructor() {
    this.names = dict();
    this.funcs = [];
  }

  add(name, func) {
    this.funcs.push(func);
    this.names[name] = this.funcs.length - 1;
  }

  addMissing(func) {
    this.missing = func;
  }

  compile(sexp, context) {
    let [, value] = sexp; // TODO: Fix this so that expression macros can return
    // things like components, so that {{component foo}}
    // is the same as {{(component foo)}}

    if (!Array.isArray(value)) return UNHANDLED;
    let name;
    let params;
    let hash;

    if (value[0] === 30
    /* Call */
    ) {
        let nameOrError = expectString(value[1], context.meta, 'Expected head of call to be a string');

        if (typeof nameOrError !== 'string') {
          return nameOrError;
        }

        name = nameOrError;
        params = value[2];
        hash = value[3];
      } else if (isGet(value)) {
      let pathName = simplePathName(value, context.meta);

      if (pathName === null) {
        return UNHANDLED;
      }

      name = pathName;
      params = null;
      hash = null;
    } else {
      return UNHANDLED;
    }

    let index = this.names[name];
    let macroContext = {
      resolver: context.syntax.program.resolverDelegate,
      meta: context.meta
    };

    if (index === undefined && this.missing) {
      let func = this.missing;
      return func(name, params, hash, macroContext);
    } else if (index !== undefined) {
      let func = this.funcs[index];
      return func(name, params, hash, macroContext);
    } else {
      return UNHANDLED;
    }
  }

}

function syntaxCompilationContext(program, macros) {
  return {
    program,
    macros
  };
}

function Context(resolver = {}, mode = "aot"
/* aot */
, macros = new MacrosImpl()) {
  return {
    program: new ProgramCompilationContext(new DefaultCompileTimeResolverDelegate(resolver), mode),
    macros
  };
}

function JitContext(resolver = {}, macros = new MacrosImpl()) {
  return {
    program: new JitProgramCompilationContext(new DefaultCompileTimeResolverDelegate(resolver)),
    macros
  };
}

function AotContext(resolver = {}, macros = new MacrosImpl()) {
  return {
    program: new ProgramCompilationContext(new DefaultCompileTimeResolverDelegate(resolver), "aot"
    /* aot */
    ),
    macros
  };
}

function templateCompilationContext(syntax, meta) {
  let encoder = new EncoderImpl();
  return {
    syntax,
    encoder,
    meta
  };
}

const STATEMENTS = new Compilers();
const INFLATE_ATTR_TABLE = ['class', 'id', 'value', 'name', 'type', 'style', 'href'];
const INFLATE_TAG_TABLE = ['div', 'span', 'p', 'a'];

function inflateTagName(tagName) {
  return typeof tagName === 'string' ? tagName : INFLATE_TAG_TABLE[tagName];
}

function inflateAttrName(attrName) {
  return typeof attrName === 'string' ? attrName : INFLATE_ATTR_TABLE[attrName];
}

STATEMENTS.add(3
/* Comment */
, sexp => op(42
/* Comment */
, sexp[1]));
STATEMENTS.add(13
/* CloseElement */
, () => op(55
/* CloseElement */
));
STATEMENTS.add(12
/* FlushElement */
, () => op(54
/* FlushElement */
));
STATEMENTS.add(4
/* Modifier */
, (sexp, meta) => {
  let [, name, params, hash] = sexp;
  let stringName = expectString(name, meta, 'Expected modifier head to be a string');

  if (typeof stringName !== 'string') {
    return stringName;
  }

  return op('IfResolved', {
    kind: "Modifier"
    /* Modifier */
    ,
    name: stringName,
    andThen: handle => [op(0
    /* PushFrame */
    ), op('SimpleArgs', {
      params,
      hash,
      atNames: false
    }), op(57
    /* Modifier */
    , handle), op(1
    /* PopFrame */
    )],
    span: {
      start: 0,
      end: 0
    }
  });
});
STATEMENTS.add(14
/* StaticAttr */
, ([, name, value, namespace]) => op(51
/* StaticAttr */
, inflateAttrName(name), value, namespace !== null && namespace !== void 0 ? namespace : null));
STATEMENTS.add(24
/* StaticComponentAttr */
, ([, name, value, namespace]) => op(108
/* StaticComponentAttr */
, inflateAttrName(name), value, namespace !== null && namespace !== void 0 ? namespace : null));
STATEMENTS.add(15
/* DynamicAttr */
, ([, name, value, namespace]) => [op('Expr', value), op(52
/* DynamicAttr */
, inflateAttrName(name), false, namespace !== null && namespace !== void 0 ? namespace : null)]);
STATEMENTS.add(22
/* TrustingDynamicAttr */
, ([, name, value, namespace]) => [op('Expr', value), op(52
/* DynamicAttr */
, inflateAttrName(name), true, namespace !== null && namespace !== void 0 ? namespace : null)]);
STATEMENTS.add(16
/* ComponentAttr */
, ([, name, value, namespace]) => [op('Expr', value), op(53
/* ComponentAttr */
, inflateAttrName(name), false, namespace !== null && namespace !== void 0 ? namespace : null)]);
STATEMENTS.add(23
/* TrustingComponentAttr */
, ([, name, value, namespace]) => [op('Expr', value), op(53
/* ComponentAttr */
, inflateAttrName(name), true, namespace !== null && namespace !== void 0 ? namespace : null)]);
STATEMENTS.add(10
/* OpenElement */
, ([, tag]) => {
  return op(48
  /* OpenElement */
  , inflateTagName(tag));
});
STATEMENTS.add(11
/* OpenElementWithSplat */
, ([, tag]) => {
  return [op(91
  /* PutComponentOperations */
  ), op(48
  /* OpenElement */
  , inflateTagName(tag))];
});
STATEMENTS.add(8
/* Component */
, ([, tag, attrs, args$$1, blocks]) => {
  if (typeof tag === 'string') {
    return op('IfResolvedComponent', {
      name: tag,
      attrs,
      blocks,
      staticTemplate: (layoutHandle, capabilities, template, {
        blocks,
        attrs
      }) => {
        return [op(80
        /* PushComponentDefinition */
        , layoutHandle), InvokeStaticComponent({
          capabilities,
          layout: template,
          attrs,
          params: null,
          hash: args$$1,
          blocks
        })];
      },
      dynamicTemplate: (layoutHandle, capabilities, {
        attrs,
        blocks
      }) => {
        return [op(80
        /* PushComponentDefinition */
        , layoutHandle), InvokeComponent({
          capabilities,
          attrs,
          params: null,
          hash: args$$1,
          atNames: true,
          blocks
        })];
      }
    });
  } else {
    return op('DynamicComponent', {
      definition: tag,
      attrs,
      params: null,
      args: args$$1,
      blocks,
      atNames: true
    });
  }
});
STATEMENTS.add(19
/* Partial */
, ([, name, evalInfo], meta) => ReplayableIf({
  args() {
    return {
      count: 2,
      actions: [op('Expr', name), op(33
      /* Dup */
      , $sp, 0)]
    };
  },

  ifTrue() {
    return [op(104
    /* InvokePartial */
    , templateMeta(meta.referrer), strArray(meta.evalSymbols), arr(evalInfo)), op(40
    /* PopScope */
    ), op(1
    /* PopFrame */
    )];
  }

}));
STATEMENTS.add(18
/* Yield */
, ([, to, params]) => YieldBlock(to, params));
STATEMENTS.add(17
/* AttrSplat */
, ([, to]) => YieldBlock(to, EMPTY_ARRAY));
STATEMENTS.add(26
/* Debugger */
, ([, evalInfo], meta) => op(106
/* Debugger */
, strArray(meta.evalSymbols), arr(evalInfo)));
STATEMENTS.add(1
/* Append */
, sexp => {
  let [, value] = sexp;
  return op('CompileInline', {
    inline: sexp,
    ifUnhandled: () => [op(0
    /* PushFrame */
    ), op("Expr"
    /* Expr */
    , value), op(3
    /* InvokeStatic */
    , {
      type: 'stdlib',
      value: 'cautious-append'
    }), op(1
    /* PopFrame */
    )]
  });
});
STATEMENTS.add(2
/* TrustingAppend */
, sexp => {
  let [, value] = sexp;

  if (typeof value === 'string') {
    return op(41
    /* Text */
    , value);
  } // macro was ignoring trusting flag doesn't seem like {{{}}} should
  // even be passed to macros, there is no {{{component}}}


  return [op(0
  /* PushFrame */
  ), op("Expr"
  /* Expr */
  , value), op(3
  /* InvokeStatic */
  , {
    type: 'stdlib',
    value: 'trusting-append'
  }), op(1
  /* PopFrame */
  )];
});
STATEMENTS.add(6
/* Block */
, sexp => {
  return op('CompileBlock', sexp);
});
const PLACEHOLDER_HANDLE = -1;

class CompilableTemplateImpl {
  constructor(statements, meta$$1, // Part of CompilableTemplate
  symbolTable) {
    this.statements = statements;
    this.meta = meta$$1;
    this.symbolTable = symbolTable;
    this.compiled = null;
  } // Part of CompilableTemplate


  compile(context) {
    return maybeCompile(this, context);
  }

}

function compilable(layout) {
  let block = layout.block;
  return new CompilableTemplateImpl(block.statements, meta(layout), {
    symbols: block.symbols,
    hasEval: block.hasEval
  });
}

function maybeCompile(compilable, context) {
  if (compilable.compiled !== null) return compilable.compiled;
  compilable.compiled = PLACEHOLDER_HANDLE;
  let {
    statements,
    meta: meta$$1
  } = compilable;
  let result = compileStatements(statements, meta$$1, context);
  patchStdlibs(context.program);
  compilable.compiled = result;
  return result;
}

function compileStatements(statements, meta$$1, syntaxContext) {
  let sCompiler = STATEMENTS;
  let context = templateCompilationContext(syntaxContext, meta$$1);

  for (let i = 0; i < statements.length; i++) {
    concatStatements(context, sCompiler.compile(statements[i], context.meta));
  }

  let handle = context.encoder.commit(syntaxContext.program.heap, meta$$1.size);
  return handle;
}

function compilableBlock(overloadBlock, containing) {
  let block = Array.isArray(overloadBlock) ? {
    statements: overloadBlock,
    parameters: EMPTY_ARRAY
  } : overloadBlock;
  return new CompilableTemplateImpl(block.statements, containing, {
    parameters: block.parameters
  });
}

class NamedBlocksImpl {
  constructor(blocks) {
    this.blocks = blocks;
    this.names = blocks ? Object.keys(blocks) : [];
  }

  get(name) {
    if (!this.blocks) return null;
    return this.blocks[name] || null;
  }

  has(name) {
    let {
      blocks
    } = this;
    return blocks !== null && name in blocks;
  }

  with(name, block) {
    let {
      blocks
    } = this;

    if (blocks) {
      return new NamedBlocksImpl(assign({}, blocks, {
        [name]: block
      }));
    } else {
      return new NamedBlocksImpl({
        [name]: block
      });
    }
  }

  get hasAny() {
    return this.blocks !== null;
  }

}

const EMPTY_BLOCKS = new NamedBlocksImpl(null);

function namedBlocks(blocks, meta) {
  if (blocks === null) {
    return EMPTY_BLOCKS;
  }

  let out = dict();
  let [keys, values] = blocks;

  for (let i = 0; i < keys.length; i++) {
    out[keys[i]] = compilableBlock(values[i], meta);
  }

  return new NamedBlocksImpl(out);
}

function expectString(expr, meta, desc) {
  if (!meta.upvars) {
    return error(`${desc}, but there were no free variables in the template`, 0, 0);
  }

  if (!Array.isArray(expr)) {
    throw new Error(`${desc}, got ${JSON.stringify(expr)}`);
  }

  if (isGet(expr)) {
    let name = simplePathName(expr, meta);
    if (name !== null) return name;
  }

  throw new Error(`${desc}, got ${JSON.stringify(expr)}`);
}

function simplePathName(opcode, meta) {
  if (opcode.length === 3 && opcode[2].length > 0) {
    return null;
  }

  if (isGetFree(opcode)) {
    return meta.upvars[opcode[1]];
  }

  return null;
}

function isGet(opcode) {
  return opcode.length >= 2 && opcode[0] >= 32
  /* GetSymbol */
  ;
}

function isGetFree(opcode) {
  return opcode[0] >= 33
  /* GetFree */
  ;
}

function compileInline(sexp, context) {
  return context.syntax.macros.inlines.compile(sexp, context);
}

function compileBlock(block, context) {
  let [, name, params, hash, named] = block;
  let blocks = namedBlocks(named, context.meta);
  let nameOrError = expectString(name, context.meta, 'Expected block head to be a string');

  if (typeof nameOrError !== 'string') {
    return nameOrError;
  }

  return context.syntax.macros.blocks.compile(nameOrError, params || [], hash, blocks, context);
}

function commit(heap, scopeSize, buffer) {
  let handle = heap.malloc();

  for (let i = 0; i < buffer.length; i++) {
    let value = buffer[i];

    if (typeof value === 'function') {
      heap.pushPlaceholder(value);
    } else if (typeof value === 'object') {
      heap.pushStdlib(value);
    } else {
      heap.push(value);
    }
  }

  heap.finishMalloc(handle, scopeSize);
  return handle;
}

let debugCompiler;

class LabelsImpl {
  constructor() {
    this.labels = dict();
    this.targets = [];
  }

  label(name, index) {
    this.labels[name] = index;
  }

  target(at, target) {
    this.targets.push({
      at,
      target
    });
  }

  patch(encoder) {
    let {
      targets,
      labels
    } = this;

    for (let i = 0; i < targets.length; i++) {
      let {
        at,
        target
      } = targets[i];
      let address = labels[target] - at;
      encoder.patch(at, address);
    }
  }

}

function error(problem, start, end) {
  return op('Error', {
    problem,
    start,
    end
  });
}

function op(name, op1, op2, op3) {
  if (typeof name === 'number') {
    if (op3 !== undefined) {
      return {
        type: 'Number',
        op: name,
        op1,
        op2,
        op3
      };
    } else if (op2 !== undefined) {
      return {
        type: 'Number',
        op: name,
        op1,
        op2
      };
    } else if (op1 !== undefined) {
      return {
        type: 'Number',
        op: name,
        op1: op1
      };
    } else {
      return {
        type: 'Number',
        op: name
      };
    }
  } else {
    let type;

    if (isCompileOpcode(name)) {
      type = 'Compile';
    } else if (isResolutionOpcode(name)) {
      type = 'Resolution';
    } else if (isSimpleOpcode(name)) {
      type = 'Simple';
    } else if (isErrorOpcode(name)) {
      type = 'Error';
    } else {
      throw new Error(`Exhausted ${name}`);
    }

    if (op1 === undefined) {
      return {
        type,
        op: name,
        op1: undefined
      };
    } else {
      return {
        type,
        op: name,
        op1
      };
    }
  }
}

class EncoderImpl {
  constructor() {
    this.labelsStack = new Stack();
    this.encoder = new InstructionEncoderImpl([]);
    this.errors = [];
  }

  error(error) {
    this.encoder.encode(30
    /* Primitive */
    , 0);
    this.errors.push(error);
  }

  commit(heap, size) {
    this.encoder.encode(5
    /* Return */
    , 1024
    /* MACHINE_MASK */
    );
    let handle = commit(heap, size, this.encoder.buffer);

    if (this.errors.length) {
      return {
        errors: this.errors,
        handle
      };
    } else {
      return handle;
    }
  }

  push(constants, name, ...args) {
    if (isMachineOp(name)) {
      let operands = args.map((operand, i) => this.operand(constants, operand, i));
      return this.encoder.encode(name, 1024
      /* MACHINE_MASK */
      , ...operands);
    } else {
      let operands = args.map((operand, i) => this.operand(constants, operand, i));
      return this.encoder.encode(name, 0, ...operands);
    }
  }

  operand(constants, operand, index) {
    if (operand && typeof operand === 'object' && operand.type === 'label') {
      this.currentLabels.target(this.encoder.size + index, operand.value);
      return -1;
    }

    return constant(constants, operand);
  }

  get currentLabels() {
    return this.labelsStack.current;
  }

  label(name) {
    this.currentLabels.label(name, this.encoder.size);
  }

  startLabels() {
    this.labelsStack.push(new LabelsImpl());
  }

  stopLabels() {
    let label = this.labelsStack.pop();
    label.patch(this.encoder);
  }

}

function constant(constants, operand) {
  if (typeof operand === 'number' || typeof operand === 'function') {
    return operand;
  }

  if (typeof operand === 'boolean') {
    return operand === true ? 1 : 0;
  }

  if (typeof operand === 'string') {
    return constants.value(operand);
  }

  if (operand === null) {
    return 0;
  }

  switch (operand.type) {
    case 'string-array':
      return constants.array(operand.value);

    case 'serializable':
      return constants.serializable(operand.value);

    case 'stdlib':
      return operand;

    case 'immediate':
      return encodeImmediate(operand.value);

    case 'primitive':
    case 'template-meta':
    case 'array':
    case 'other':
      return encodeHandle(constants.value(operand.value));

    case 'lookup':
      throw unreachable('lookup not reachable');

    default:
      return exhausted(operand);
  }
}

function isSimpleOpcode(op) {
  return op === 'Label' || op === 'Option' || op === 'GetComponentLayout' || op === 'StartLabels' || op === 'StopLabels' || op === 'SimpleArgs' || op === 'JitCompileBlock' || op === 'SetBlock';
}

function isCompileOpcode(op) {
  return op === 'CompileInline' || op === 'CompileBlock' || op === 'InvokeStatic' || op === 'PushCompilable' || op === 'Args' || op === 'IfResolvedComponent' || op === 'DynamicComponent';
}

function isResolutionOpcode(op) {
  return op === 'IfResolved' || op === 'Expr' || op === 'SimpleArgs' || op === 'ResolveFree' || op === 'ResolveContextualFree';
}

function isErrorOpcode(op) {
  return op === 'Error';
}
/**
 * Compile arguments, pushing an Arguments object onto the stack.
 *
 * @param args.params
 * @param args.hash
 * @param args.blocks
 * @param args.atNames
 */


function CompileArgs({
  params,
  hash,
  blocks,
  atNames
}) {
  let out = [];
  let blockNames = blocks.names;

  for (let i = 0; i < blockNames.length; i++) {
    out.push(PushYieldableBlock(blocks.get(blockNames[i])));
  }

  let {
    count,
    actions
  } = CompilePositional(params);
  out.push(actions);
  let flags = count << 4;
  if (atNames) flags |= 0b1000;

  if (blocks) {
    flags |= 0b111;
  }

  let names = EMPTY_ARRAY;

  if (hash) {
    names = hash[0];
    let val = hash[1];

    for (let i = 0; i < val.length; i++) {
      out.push(op('Expr', val[i]));
    }
  }

  out.push(op(84
  /* PushArgs */
  , strArray(names), strArray(blockNames), flags));
  return out;
}
/**
 * Compile an optional list of positional arguments, which pushes each argument
 * onto the stack and returns the number of parameters compiled
 *
 * @param params an optional list of positional arguments
 */


function CompilePositional(params) {
  if (!params) return {
    count: 0,
    actions: NONE
  };
  let actions = [];

  for (let i = 0; i < params.length; i++) {
    actions.push(op('Expr', params[i]));
  }

  return {
    count: params.length,
    actions
  };
}

function meta(layout) {
  return {
    asPartial: layout.asPartial || false,
    evalSymbols: evalSymbols(layout),
    upvars: layout.block.upvars,
    referrer: layout.referrer,
    size: layout.block.symbols.length
  };
}

function evalSymbols(layout) {
  let {
    block
  } = layout;
  return block.hasEval ? block.symbols : null;
}

const ATTRS_BLOCK = '&attrs';

function StaticComponentHelper(context, tag, hash, template) {
  let component = resolveLayoutForTag(tag, context);

  if (component !== null) {
    let {
      compilable: compilable$$1,
      handle,
      capabilities
    } = component;

    if (compilable$$1) {
      if (hash) {
        for (let i = 0; i < hash.length; i = i + 2) {
          hash[i][0] = `@${hash[i][0]}`;
        }
      }

      let out = [op(80
      /* PushComponentDefinition */
      , handle)];
      out.push(InvokeStaticComponent({
        capabilities,
        layout: compilable$$1,
        attrs: null,
        params: null,
        hash,
        blocks: new NamedBlocksImpl({
          default: template
        })
      }));
      return out;
    }
  }

  return UNHANDLED;
}

function InvokeStaticComponent({
  capabilities,
  layout,
  attrs,
  params,
  hash,
  blocks
}) {
  let {
    symbolTable
  } = layout;
  let bailOut = symbolTable.hasEval || capabilities.prepareArgs;

  if (bailOut) {
    return InvokeComponent({
      capabilities,
      attrs,
      params,
      hash,
      atNames: true,
      blocks,
      layout
    });
  }

  let out = [op(36
  /* Fetch */
  , $s0), op(33
  /* Dup */
  , $sp, 1), op(35
  /* Load */
  , $s0)];
  let {
    symbols
  } = symbolTable;

  if (capabilities.createArgs) {
    out.push(op(0
    /* PushFrame */
    ), op('SimpleArgs', {
      params,
      hash,
      atNames: true
    }));
  }

  out.push(op(100
  /* BeginComponentTransaction */
  ));

  if (capabilities.dynamicScope) {
    out.push(op(59
    /* PushDynamicScope */
    ));
  }

  if (capabilities.createInstance) {
    out.push(op(89
    /* CreateComponent */
    , blocks.has('default') | 0, $s0));
  }

  if (capabilities.createArgs) {
    out.push(op(1
    /* PopFrame */
    ));
  }

  out.push(op(0
  /* PushFrame */
  ), op(90
  /* RegisterComponentDestructor */
  , $s0));
  let bindings = [];
  out.push(op(92
  /* GetComponentSelf */
  , $s0));
  bindings.push({
    symbol: 0,
    isBlock: false
  });

  for (let i = 0; i < symbols.length; i++) {
    let symbol = symbols[i];

    switch (symbol.charAt(0)) {
      case '&':
        let callerBlock;

        if (symbol === ATTRS_BLOCK) {
          callerBlock = attrs;
        } else {
          callerBlock = blocks.get(symbol.slice(1));
        }

        if (callerBlock) {
          out.push(PushYieldableBlock(callerBlock));
          bindings.push({
            symbol: i + 1,
            isBlock: true
          });
        } else {
          out.push(PushYieldableBlock(null));
          bindings.push({
            symbol: i + 1,
            isBlock: true
          });
        }

        break;

      case '@':
        if (!hash) {
          break;
        }

        let [keys, values] = hash;
        let lookupName = symbol;
        let index = keys.indexOf(lookupName);

        if (index !== -1) {
          out.push(op('Expr', values[index]));
          bindings.push({
            symbol: i + 1,
            isBlock: false
          });
        }

        break;
    }
  }

  out.push(op(37
  /* RootScope */
  , symbols.length + 1, Object.keys(blocks).length > 0 ? 1 : 0));

  for (let i = bindings.length - 1; i >= 0; i--) {
    let {
      symbol,
      isBlock
    } = bindings[i];

    if (isBlock) {
      out.push(op('SetBlock', symbol));
    } else {
      out.push(op(19
      /* SetVariable */
      , symbol));
    }
  }

  out.push(op('InvokeStatic', layout));

  if (capabilities.createInstance) {
    out.push(op(103
    /* DidRenderLayout */
    , $s0));
  }

  out.push(op(1
  /* PopFrame */
  ), op(40
  /* PopScope */
  ));

  if (capabilities.dynamicScope) {
    out.push(op(60
    /* PopDynamicScope */
    ));
  }

  out.push(op(101
  /* CommitComponentTransaction */
  ), op(35
  /* Load */
  , $s0));
  return out;
}

function InvokeDynamicComponent(meta$$1, {
  definition,
  attrs,
  params,
  hash,
  atNames,
  blocks
}) {
  return Replayable({
    args: () => {
      return {
        count: 2,
        actions: [op('Expr', definition), op(33
        /* Dup */
        , $sp, 0)]
      };
    },
    body: () => {
      return [op(66
      /* JumpUnless */
      , label('ELSE')), op(83
      /* ResolveDynamicComponent */
      , templateMeta(meta$$1.referrer)), op(81
      /* PushDynamicComponentInstance */
      ), InvokeComponent({
        capabilities: true,
        attrs,
        params,
        hash,
        atNames,
        blocks
      }), op('Label', 'ELSE')];
    }
  });
}

function WrappedComponent(layout, attrsBlockNumber) {
  return [op('StartLabels'), WithSavedRegister($s1, () => [op(93
  /* GetComponentTagName */
  , $s0), op(31
  /* PrimitiveReference */
  ), op(33
  /* Dup */
  , $sp, 0)]), op(66
  /* JumpUnless */
  , label('BODY')), op(36
  /* Fetch */
  , $s1), op(91
  /* PutComponentOperations */
  ), op(49
  /* OpenDynamicElement */
  ), op(102
  /* DidCreateElement */
  , $s0), YieldBlock(attrsBlockNumber, EMPTY_ARRAY), op(54
  /* FlushElement */
  ), op('Label', 'BODY'), InvokeStaticBlock(blockForLayout(layout)), op(36
  /* Fetch */
  , $s1), op(66
  /* JumpUnless */
  , label('END')), op(55
  /* CloseElement */
  ), op('Label', 'END'), op(35
  /* Load */
  , $s1), op('StopLabels')];
}

function StaticComponent(component, args$$1) {
  let [params, hash, blocks] = args$$1;
  if (component === null) return NONE;
  let {
    compilable: compilable$$1,
    capabilities,
    handle
  } = component;

  if (compilable$$1) {
    return [op(80
    /* PushComponentDefinition */
    , handle), InvokeStaticComponent({
      capabilities: capabilities || MINIMAL_CAPABILITIES,
      layout: compilable$$1,
      attrs: null,
      params,
      hash,
      blocks
    })];
  } else {
    return [op(80
    /* PushComponentDefinition */
    , handle), InvokeComponent({
      capabilities: capabilities || MINIMAL_CAPABILITIES,
      attrs: null,
      params,
      hash,
      atNames: true,
      blocks
    })];
  }
}

function InvokeComponent({
  capabilities,
  attrs,
  params,
  hash,
  atNames,
  blocks: namedBlocks$$1,
  layout
}) {
  let bindableBlocks = !!namedBlocks$$1;
  let bindableAtNames = capabilities === true || capabilities.prepareArgs || !!(hash && hash[0].length !== 0);
  let blocks = namedBlocks$$1.with('attrs', attrs);
  return [op(36
  /* Fetch */
  , $s0), op(33
  /* Dup */
  , $sp, 1), op(35
  /* Load */
  , $s0), op(0
  /* PushFrame */
  ), op('Args', {
    params,
    hash,
    blocks,
    atNames
  }), op(87
  /* PrepareArgs */
  , $s0), invokePreparedComponent(blocks.has('default'), bindableBlocks, bindableAtNames, () => {
    let out;

    if (layout) {
      out = [PushSymbolTable(layout.symbolTable), op('PushCompilable', layout), op('JitCompileBlock')];
    } else {
      out = [op('GetComponentLayout', $s0)];
    }

    out.push(op(98
    /* PopulateLayout */
    , $s0));
    return out;
  }), op(35
  /* Load */
  , $s0)];
}

function invokePreparedComponent(hasBlock, bindableBlocks, bindableAtNames, populateLayout = null) {
  let out = [op(100
  /* BeginComponentTransaction */
  ), op(59
  /* PushDynamicScope */
  ), op(89
  /* CreateComponent */
  , hasBlock | 0, $s0)]; // this has to run after createComponent to allow
  // for late-bound layouts, but a caller is free
  // to populate the layout earlier if it wants to
  // and do nothing here.

  if (populateLayout) {
    out.push(populateLayout());
  }

  out.push(op(90
  /* RegisterComponentDestructor */
  , $s0), op(92
  /* GetComponentSelf */
  , $s0), op(38
  /* VirtualRootScope */
  , $s0), op(19
  /* SetVariable */
  , 0), op(97
  /* SetupForEval */
  , $s0), bindableAtNames ? op(17
  /* SetNamedVariables */
  , $s0) : NONE, bindableBlocks ? op(18
  /* SetBlocks */
  , $s0) : NONE, op(34
  /* Pop */
  , 1), op(99
  /* InvokeComponentLayout */
  , $s0), op(103
  /* DidRenderLayout */
  , $s0), op(1
  /* PopFrame */
  ), op(40
  /* PopScope */
  ), op(60
  /* PopDynamicScope */
  ), op(101
  /* CommitComponentTransaction */
  ));
  return out;
}

function InvokeBareComponent() {
  return [op(36
  /* Fetch */
  , $s0), op(33
  /* Dup */
  , $sp, 1), op(35
  /* Load */
  , $s0), op(0
  /* PushFrame */
  ), op(85
  /* PushEmptyArgs */
  ), op(87
  /* PrepareArgs */
  , $s0), invokePreparedComponent(false, false, true, () => [op('GetComponentLayout', $s0), op(98
  /* PopulateLayout */
  , $s0)]), op(35
  /* Load */
  , $s0)];
}

function curryComponent({
  definition,
  params,
  hash,
  atNames
}, referrer) {
  return [op(0
  /* PushFrame */
  ), op('SimpleArgs', {
    params,
    hash,
    atNames
  }), op(88
  /* CaptureArgs */
  ), op('Expr', definition), op(79
  /* CurryComponent */
  , templateMeta(referrer)), op(1
  /* PopFrame */
  ), op(36
  /* Fetch */
  , $v0)];
}

function blockForLayout(layout) {
  return compilableBlock(layout.block.statements, meta(layout));
}

function WithSavedRegister(register, block) {
  return [op(36
  /* Fetch */
  , register), block(), op(35
  /* Load */
  , register)];
}

class StdLib {
  constructor(main, trustingGuardedAppend, cautiousGuardedAppend) {
    this.main = main;
    this.trustingGuardedAppend = trustingGuardedAppend;
    this.cautiousGuardedAppend = cautiousGuardedAppend;
  }

  get 'trusting-append'() {
    return this.trustingGuardedAppend;
  }

  get 'cautious-append'() {
    return this.cautiousGuardedAppend;
  }

  getAppend(trusting) {
    return trusting ? this.trustingGuardedAppend : this.cautiousGuardedAppend;
  }

}

function main() {
  return [op(76
  /* Main */
  , $s0), invokePreparedComponent(false, false, true)];
}
/**
 * Append content to the DOM. This standard function triages content and does the
 * right thing based upon whether it's a string, safe string, component, fragment
 * or node.
 *
 * @param trusting whether to interpolate a string as raw HTML (corresponds to
 * triple curlies)
 */


function StdAppend(trusting) {
  return [op(78
  /* ContentType */
  ), SwitchCases(when => {
    when(1
    /* String */
    , () => {
      if (trusting) {
        return [op(68
        /* AssertSame */
        ), op(43
        /* AppendHTML */
        )];
      } else {
        return op(47
        /* AppendText */
        );
      }
    });
    when(0
    /* Component */
    , () => [op(82
    /* PushCurriedComponent */
    ), op(81
    /* PushDynamicComponentInstance */
    ), InvokeBareComponent()]);
    when(3
    /* SafeString */
    , () => [op(68
    /* AssertSame */
    ), op(44
    /* AppendSafeHTML */
    )]);
    when(4
    /* Fragment */
    , () => [op(68
    /* AssertSame */
    ), op(45
    /* AppendDocumentFragment */
    )]);
    when(5
    /* Node */
    , () => [op(68
    /* AssertSame */
    ), op(46
    /* AppendNode */
    )]);
  })];
}

function compileStd(context) {
  let mainHandle = build(context, main);
  let trustingGuardedAppend = build(context, () => StdAppend(true));
  let cautiousGuardedAppend = build(context, () => StdAppend(false));
  return new StdLib(mainHandle, trustingGuardedAppend, cautiousGuardedAppend);
}

const STDLIB_META = {
  asPartial: false,
  evalSymbols: null,
  upvars: null,
  // TODO: ??
  referrer: {},
  size: 0
};

function build(program, callback) {
  let encoder = new EncoderImpl();
  let macros = new MacrosImpl();
  let stdContext = {
    encoder,
    meta: STDLIB_META,
    syntax: {
      macros,
      program
    }
  };
  concat(stdContext, callback());
  let result = encoder.commit(program.heap, 0);

  if (typeof result !== 'number') {
    // This shouldn't be possible
    throw new Error(`Unexpected errors compiling std`);
  } else {
    return result;
  }
}

class ProgramCompilationContext {
  constructor(delegate, mode) {
    this.mode = mode;
    this.constants = new WriteOnlyConstants();
    this.heap = new HeapImpl();
    this.resolverDelegate = delegate;
    this.stdlib = compileStd(this);
  }

}

class JitProgramCompilationContext {
  constructor(delegate) {
    this.constants = new JitConstants();
    this.heap = new HeapImpl();
    this.mode = "jit"
    /* jit */
    ;
    this.resolverDelegate = delegate;
    this.stdlib = compileStd(this);
  }

}

class PartialDefinitionImpl {
  constructor(name, // for debugging
  template) {
    this.name = name;
    this.template = template;
  }

  getPartial(context) {
    let partial = unwrapTemplate(this.template).asPartial();
    let handle = partial.compile(context);
    return {
      symbolTable: partial.symbolTable,
      handle
    };
  }

}

class WrappedBuilder {
  constructor(layout) {
    this.layout = layout;
    this.compiled = null;
    let {
      block
    } = layout;
    let symbols = block.symbols.slice(); // ensure ATTRS_BLOCK is always included (only once) in the list of symbols

    let attrsBlockIndex = symbols.indexOf(ATTRS_BLOCK);

    if (attrsBlockIndex === -1) {
      this.attrsBlockNumber = symbols.push(ATTRS_BLOCK);
    } else {
      this.attrsBlockNumber = attrsBlockIndex + 1;
    }

    this.symbolTable = {
      hasEval: block.hasEval,
      symbols
    };
  }

  compile(syntax) {
    if (this.compiled !== null) return this.compiled;
    let m = meta(this.layout);
    let context = templateCompilationContext(syntax, m);
    let actions = WrappedComponent(this.layout, this.attrsBlockNumber);
    concatStatements(context, actions);
    let handle = context.encoder.commit(context.syntax.program.heap, m.size);

    if (typeof handle !== 'number') {
      return handle;
    }

    this.compiled = handle;
    patchStdlibs(context.syntax.program);
    return handle;
  }

}

let clientId = 0;

function templateFactory({
  id: templateId,
  meta,
  block
}) {
  let parsedBlock;
  let id = templateId || `client-${clientId++}`;

  let create = envMeta => {
    let newMeta = envMeta ? assign({}, envMeta, meta) : meta;

    if (!parsedBlock) {
      parsedBlock = JSON.parse(block);
    }

    return new TemplateImpl({
      id,
      block: parsedBlock,
      referrer: newMeta
    });
  };

  return {
    id,
    meta,
    create
  };
}

class TemplateImpl {
  constructor(parsedLayout) {
    this.parsedLayout = parsedLayout;
    this.result = 'ok';
    this.layout = null;
    this.partial = null;
    this.wrappedLayout = null;
    let {
      block
    } = parsedLayout;
    this.symbols = block.symbols;
    this.hasEval = block.hasEval;
    this.referrer = parsedLayout.referrer;
    this.id = parsedLayout.id || `client-${clientId++}`;
  }

  asLayout() {
    if (this.layout) return this.layout;
    return this.layout = compilable(assign({}, this.parsedLayout, {
      asPartial: false
    }));
  }

  asPartial() {
    if (this.partial) return this.partial;
    return this.layout = compilable(assign({}, this.parsedLayout, {
      asPartial: true
    }));
  }

  asWrappedLayout() {
    if (this.wrappedLayout) return this.wrappedLayout;
    return this.wrappedLayout = new WrappedBuilder(assign({}, this.parsedLayout, {
      asPartial: false
    }));
  }

}

function Component(serialized, envMeta) {
  let parsed = JSON.parse(serialized);
  let factory = templateFactory(parsed);
  let template = unwrapTemplate(factory.create(envMeta));
  return template.asLayout();
}

export { MacrosImpl, UNHANDLED, NONE, debugCompiler, compileStatements, compilable, StaticComponent as staticComponent, InvokeStaticBlockWithStack as invokeStaticBlockWithStack, InvokeStaticBlock as invokeStaticBlock, compileStd, meta, StdLib, PartialDefinitionImpl, templateFactory, Component, WrappedBuilder, EMPTY_BLOCKS, resolveLayoutForTag, ProgramCompilationContext, JitProgramCompilationContext, syntaxCompilationContext, Context, JitContext, AotContext, templateCompilationContext, DEFAULT_CAPABILITIES, MINIMAL_CAPABILITIES, DefaultCompileTimeResolverDelegate };