{% extends "index.html.j2" %}

{% block markdowncell -%}

## this is a markdown cell
{{ super() }}
wowowowow
## THIS IS THE END
{% endblock markdowncell %}

{% block codecell %}
<div {{ cell_id_anchor(cell) }} class="cell border-box-sizing code_cell rendered{{ celltags(cell) }}">
{{ super() }}
</div>
{%- endblock codecell %}


{%- block html_head_js -%}

<script src="{{ resources.easymde_url }}"></script>

{%- block html_head_js_jquery -%}
<script src="{{ resources.jquery_url }}"></script>
{%- endblock html_head_js_jquery -%}
{%- block html_head_js_requirejs -%}
<script src="{{ resources.require_js_url }}"></script>
{%- endblock html_head_js_requirejs -%}
{%- block html_head_js_mermaidjs -%}
<script type="module">
  import mermaid from '{{ resources.mermaid_js_url }}';
  mermaid.initialize({ startOnLoad: true });
</script>
{%- endblock html_head_js_mermaidjs -%}
{%- endblock html_head_js -%}