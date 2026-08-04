const {
  layout,
  layout_with,
  sep1
} = require('./util.js');

module.exports = {
  template: $ => seq(
    'template',
    field('head', $._type_head),
    optional(seq('with', field('payload', $.daml_fields))),
    'where',
    field('body', $.template_body)
  ),

  daml_fields: $ => layout($, field('field', $.daml_field)),
  daml_field: $ => seq($.variable, ':', $.quantified_type),

  template_body: $ => layout($, field('item', $.template_item)),

  template_item: $ => choice(
    $.signatory,
    $.observer,
    $.ensure,
    $.agreement,
    $.key,
    $.maintainer,
    $.choice,
    $.interface_instance
  ),

  choice: $ => seq(
    optional(choice('nonconsuming', 'preconsuming', 'postconsuming')),
    'choice',
    field('name', $._constructor),
    ':',
    field('return_type', $.quantified_type),
    optional(seq('with', field('arguments', $.daml_fields))),
    // Daml allows the choice `observer` clause before or after `controller`.
    optional($.observer),
    $.controller,
    optional($.observer),
    field('body', $._exp_do)
  ),

  signatory: $ => seq(
    'signatory', sep1(',', $.expression)
  ),
  observer: $ => seq(
    'observer', sep1(',', $.expression)
  ),
  controller: $ => seq(
    'controller', sep1(',', $.expression)
  ),
  ensure: $ => seq(
    'ensure', $._exp
  ),
  agreement: $ => seq(
    'agreement', $._exp
  ),

  // --- Contract keys ---------------------------------------------------------
  // `key <expr> : <type>` and `maintainer <expr>`. Daml uses a single `:` for
  // type ascription (unlike Haskell's `::`), matching `daml_field`. Note `key`
  // is contextual: keyword extraction (`word: $ => $.variable`) still lexes it
  // as a plain identifier in expression position, so `maintainer key` works.
  key: $ => seq(
    'key',
    field('expression', $.expression)
  ),
  maintainer: $ => seq(
    'maintainer', sep1(',', $.expression)
  ),

  // `key` used as an expression atom (see `_exp_name`).
  key_expression: $ => 'key',

  // --- Interfaces ------------------------------------------------------------
  interface: $ => seq(
    'interface',
    field('name', $.name),
    optional(seq('requires', sep1(',', field('required', $._tyconids)))),
    'where',
    field('body', $.interface_body)
  ),

  interface_body: $ => layout($, field('item', $.interface_item)),

  interface_item: $ => choice(
    $.viewtype,
    $.interface_method,
    $.choice
  ),

  viewtype: $ => seq('viewtype', field('type', $.quantified_type)),

  // Abstract interface method signature, e.g. `getOwner : Party`.
  interface_method: $ => seq(
    field('name', $.variable),
    ':',
    field('type', $.quantified_type)
  ),

  // Template clause `interface instance I for T where <method impls>`.
  interface_instance: $ => seq(
    'interface',
    'instance',
    field('interface', $._tyconids),
    'for',
    field('template', $._tyconids),
    'where',
    field('body', $.interface_instance_body)
  ),

  interface_instance_body: $ => layout($, field('declaration', $.decl)),

  daml_scenario: $ => seq(
    'scenario',
    field('body', $._exp)
  ),

  _exp_with: $ => prec.left('apply', seq(
    $.expression,
    'with',
    $.with_fields
  )),

  // Record `with` fields may be written one-per-line (layout) or comma-separated
  // inline (`r with a = 1, b = 2`, `Foo with dso, provider`). Allowing a
  // comma-separated list as each layout item supports both forms.
  with_fields: $ => layout_with($, sep1(',', $.with_field)),

  // Modelled on `field_update` (`{ }` records): parse the field name first and
  // make the `= <expr>` optional. A `choice` between `var = exp` and a bare
  // `var` (pun) instead creates an unresolved shift/reduce conflict that breaks
  // any `with` block mixing punned and assigned fields (`with dso; owner = sv`).
  with_field: $ => choice(
    alias('..', $.wildcard),
    seq(
      field('field', $.variable),
      optional(seq('=', field('expression', $._exp)))
    )
  ),
};
