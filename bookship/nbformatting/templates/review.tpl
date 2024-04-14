{% extends "index.html.j2" %}



{%- block body -%}
    <div class="flex-container">
        <div id='nbCol' class='nbCol'>{{ super() }}</div>
        <div id='annotationCol' class='annotationCol'></div>
    </div>

{%- endblock body -%}


{%- block body_header -%}
{% if resources.theme == 'dark' %}
<body class="jp-Notebook" data-jp-theme-light="false" data-jp-theme-name="JupyterLab Dark" data-nb-sha256="{{ resources.notebook_sha256 }}">
{% else %}
<body class="jp-Notebook" data-jp-theme-light="true" data-jp-theme-name="JupyterLab Light" data-nb-sha256="{{ resources.notebook_sha256 }}">
{% endif %}
<main>
{%- endblock body_header -%}

{% block markdowncell -%}
{{ super() }}
{% endblock markdowncell %}


{% block in_prompt -%}
<div class="jp-InputPrompt jp-InputArea-prompt">
    {%- if cell.execution_count is defined -%}
        <div class='cellTags'>In&nbsp;[{{ cell.execution_count|replace(None, "&nbsp;") }}]:</div>
        <div class='hiddenHash'>{{cell.id}}</div>
    {%- else -%}
        <div class='cellTags'>In&nbsp;[&nbsp;]:</div>
        <div class='hiddenHash'>{{cell.id}}</div>
    {%- endif -%}
</div>
{%- endblock in_prompt %}

{% block empty_in_prompt -%} 
<div class="jp-InputPrompt jp-InputArea-prompt" style="color: black; opacity: 1;">
    <button class="new-comment-thread" id="code-{{cell.id}}_markdown" onclick="annotateContent(this);event.stopPropagation()">+</button>
</div>
{%- endblock empty_in_prompt %}

{% block output_area_prompt %}
    <div class="jp-OutputPrompt jp-OutputArea-prompt" style="color: black; opacity: 1;">
{%- if output.output_type == 'execute_result' -%}
    {%- if cell.execution_count is defined -%}
        Out[{{ cell.execution_count|replace(None, "&nbsp;") }}]:
    {%- else -%}
        Out[&nbsp;]:
    {%- endif -%}
{%- endif -%}
        <button class="new-comment-thread" id="code-{{cell.id}}_outputs" onclick="annotateContent(this);event.stopPropagation()" style="padding-right: 4px;">+</button>
    </div>
{% endblock output_area_prompt %}

{% block input %}
<div class="jp-CodeMirrorEditor jp-Editor jp-InputArea-editor" data-type="inline">
     <div class="cm-editor cm-s-jupyter">

     <table class='cellTable' data-cell_id="{{cell.id}}">
     <colgroup>
     <col width="80"></col>
     <col></col>
     </colgroup>
     {% for codeLine, codeContents in cell.source | split_newlines %}
     <tbody>
     <tr>
        <td class="lineCol"><a href="#{{cell.id}}-{{codeLine}}" style="padding-right: 2px; color:#70747c; opacity:0.9;">{{ codeLine }}</a><button class="new-comment-thread" id="commentable-{{cell.id}}_{{codeLine}}" onclick="annotateContent(this);event.stopPropagation()">+</button></td>
        <td class="flex-container lineCode" id="code-{{cell.id}}_{{codeLine}}">{{ codeContents | highlight_code(metadata=cell.metadata) | clean_html }}</td>
     </tr>
     </tbody>
     {%- endfor -%}
     </table>

     </div>
</div>
{%- endblock input %}

<button class="add-line-comment" onclick="annotateContent(this);event.stopPropagation()">+</button>





{% block extra_css %}

{% for css in resources.cells_css %}
<style> {{ css }} </style>
{%- endfor -%}
{%- endblock extra_css -%}

{%- block html_head_js -%}

<meta name="csrf-token" content="{{ resources.csrf_token }}">
<script  src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/codemirror.min.js"></script
<script  src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/6.65.7/mode/python/python.js"></script
<link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
<script src="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js"></script>
<link href="https://fonts.googleapis.com/css?family=Roboto+Mono&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Roboto&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css?family=Roboto+Serif&display=swap" rel="stylesheet">

<link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootswatch@4.5.2/flatly/bootstrap.min.css" rel="stylesheet">

{%- block html_head_js_jquery -%}
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous" type="text/javascript"></script>
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



{% block footer_js %}

{% for js_code in resources.footer_js %}
<script> {{ js_code }} </script>
{%- endfor -%}

{% endblock footer_js %}



{% block body_footer %}

<script>
var anchorTags = document.querySelectorAll("a");

anchorTags.forEach(function(anchor) {
    anchor.addEventListener("click", function(e) {
        e.preventDefault(); 
        var targetId = this.getAttribute("href")
        var targetElement = document.querySelectorAll(`a[href="${targetId}"]`)[0]
        console.log(targetElement)
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: "smooth" });
        }
    });
});
</script>
{{ super() }}

{% endblock body_footer %}