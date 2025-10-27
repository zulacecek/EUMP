<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import * as monaco from 'monaco-editor'

var props = defineProps({
  value: String
});

watch(() => props.value, (newValue) => {
   if(editorInstance) {
        editorInstance.setValue(newValue);
   }
});

const editorContainer = ref();
let editorInstance : any;

var emit = defineEmits(['valueChanged']);

function emitValueChanged() {
    emit('valueChanged', editorInstance.getValue());
}

onMounted(() => {
    monaco.languages.register({ id: 'paradox' });
    monaco.languages.setLanguageConfiguration("paradox", {
        brackets: [["{", "}"]],
    });

    monaco.languages.setMonarchTokensProvider('paradox', {
        keywords: [
        "NOT_USED_1", "NOT_USED_2", "ROOT", "root", "FROM", "from", "FROMFROM",
        "fromfrom", "FROMFROMFROM", "fromfromfrom", "FROMFROMFROMFROM", "fromfromfromfrom",
        "PREV", "prev", "PREVPREV", "prevprev", "PREVPREVPREV", "prevprevprev",
        "PREVPREVPREVPREV", "prevprevprevprev", "THIS", "this", "variable", "hidden_effect",
        ],

        brackets: [
            { open: '{', close: '}', token: 'delimiter.curly' },
            { open: '[', close: ']', token: 'delimiter.square' },
            { open: '(', close: ')', token: 'delimiter.parenthesis' },
            { open: '<', close: '>', token: 'delimiter.angle' }
        ],
        
        tokenizer: {
            root: [
                // [/\s*(namespace)\s*=\s*([A-Za-z0-9.]+)/, ["keyword.other.namespace.paradox", "entity.name.type.namespace.paradox"]],
                // [/\s*(id)\s*=\s*([A-Za-z_]+\.[0-9]+)/, ["keyword.other.id.paradox", "entity.name.type.id.paradox"]],
                [/#.*$/, "comment.line.number-sign.paradox"],
                [/@\w+/, "variable.constant.paradox"],
                [/\b(NOT_USED_1|NOT_USED_2|ROOT|root|OR|AND|if|else|IF|ELSE|NOT|limit|FROM|from|FROMFROM|fromfrom|FROMFROMFROM|fromfromfrom|FROMFROMFROMFROM|fromfromfromfrom|PREV|prev|PREVPREV|prevprev|PREVPREVPREV|prevprevprev|PREVPREVPREVPREV|prevprevprevprev|THIS|this)\b/, "keyword.control.paradox"],
                [/"[^"]*"/, "string.quoted.double.paradox"],
                [/\b\d+(\.\d+)?\b/, "constant.numeric.paradox"],
                [/\b[a-zA-Z_.][a-zA-Z0-9_.]*\b(?!\s*(=|>|<|<=|>=))/g, "variable.other.paradox"],
                [/\b([A-Za-z_\.][A-Za-z0-9_\.]*)\b(?=\s*(=|>|<|<=|>=))/, "variable.parameter.paradox"],
                [/event_target(:)(\w+)/, ["variable.event.target.paradox", "punctuation.event_target.colon.paradox", "event_target.name.paradox"]],
                [/\b([A-Za-z_\.][A-Za-z0-9_\.]*)\b(?!\s*(=|>|<|<=|>=))/g, "variable.other.paradox"],                
            ]
        }
    });

    self.MonacoEnvironment = {
        getWorker(_: any, label: string) {
            return new Worker(new URL('./paradox.worker.ts', import.meta.url), {
               type: 'module',
            });
        }
    };

    editorInstance = monaco.editor.create(editorContainer.value, {
        value: props.value,
        language: "paradox",
        theme: 'vs-dark',
        autoClosingBrackets: 'always',
        bracketPairColorization: { enabled: true }
    });

    editorInstance.onDidChangeModelContent(emitValueChanged);
});

</script>

<template>
    <div class="monaco-editor-container">
        <div ref="editorContainer" style="width: 100%; height: 100%;"></div>
    </div>
</template>

<style scoped>

.monaco-editor-container {
    height: 100%;
    text-align: left!important;
    padding: 1rem;
}

</style>