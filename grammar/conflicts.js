module.exports = {

  conflicts: $ => [

    /**
     * For reference in GHC:
     * - Note [Ambiguous syntactic categories]
     * - Note [PatBuilder]
     * - Note [Declaration/signature overlap]
     * - These correspond to `DisambECP`
     *
     * (fun x) y = undefined
     * (fun x -> y) = undefined
     * (fun) <> x = undefined
     *
     * The first one is a regular function with some redundant parens, where `fun` is the declared name.
     * The second one is a pattern binder with a view pattern, where `fun` is a free variable.
     * The third one is an infix pattern binder, where `fun` is a simple varid pattern with redundant parens.
     *
     * These conflicts are also relevant for top-level expression splices, which fundamentally conflict with decls, and
     * since decls start with either `var` or `pat`, they cannot be disambiguated.
     *
     * GHC parses functions and binds as expressions and sorts them into the right LHS in a post-processing step.
     * Since this is not possible in tree-sitter, these conflicts are more function-centric than in GHC.
     *
     * function:
     * func (A a) = a
     *
     * bind variable:
     * a : as = [1, 2, 3]
     *
     * pattern bind infix:
     * a : as = [1, 2, 3]
     *
     * pattern bind prefix:
     * Just 1 = Just 1
     *
     * splice:
     * makeLenses ''A
     *
     * Signature and bind:
     *
     * fun :: Int
     * fun :: Int = 5
     */

    // Function vs bind
    [$._function_name, $.pattern],

    // Function vs bind vs splice
    [$._function_name, $.pattern, $.expression],

    // Bind vs splice
    [$.pattern, $.expression],

    // Signature vs bind
    [$.signature, $.pattern],

    /**
     * Unboxed syntax
     *
     * The hash in the opening parenthesis of unboxed tuples can be an operator.
     */
    [$._operator_hash_head, $._unboxed_open],
    [$._exp_apply, $.controller],
    [$._exp_apply, $.observer],

    // Daml record-`with` pattern field: `f` may be a punned field or the start
    // of `f = p`; defer the decision to GLR (same as record `field_update`).
    [$.pat_with_field],
  ],

}
