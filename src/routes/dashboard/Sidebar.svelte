<script lang="ts">
    import { records } from '$lib/stores/records';

    // Assuming RecordItem and Field types are imported or available in context
    type RecordItem = any; 
    type Field = any;

    // 🟢 SVELTE 5: Props declaration
    let { selectField, selectedFieldId } = $props(); 

    // 🟢 NEW STATE: Local state to bind the filter input
    let filterTerm = $state('');

    // 🟢 DERIVED STATE: Filtered records structure
    const filteredRecords = $derived(() => {
        const term = filterTerm.trim().toLowerCase();
        if (!term) {
            return $records;
        }

        return $records.map(record => {
            const recordTitleMatches = record.title?.toLowerCase().includes(term);

            const filteredFields = record.fields.filter((field: Field) => {
                const fieldNameMatches = field.field_name?.toLowerCase().includes(term);
                return recordTitleMatches || fieldNameMatches;
            });

            if (recordTitleMatches || filteredFields.length > 0) {
                return {
                    ...record,
                    fields: filteredFields,
                };
            }
            return null;
        }).filter(r => r !== null) as RecordItem[];
    });
</script>

<aside class="col-span-2 -my-2 flex h-screen flex-col bg-white shadow-xl">
    
    <div class="p-6 pb-4 border-b border-gray-100 flex-shrink-0">
        <input
            type="text"
            placeholder="Filter records or fields..."
            bind:value={filterTerm}
            class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 transition duration-150"
        />
    </div>

    <div class="flex-1 overflow-y-auto p-6 pt-2">
        
        {#each filteredRecords() as record (record.record_id)}
            
            <ul class="ml-2 mb-3 space-y-2"> 
                {#each record.fields as field (field.field_id)}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <li
                        class="cursor-pointer rounded-lg px-5 py-2 transition-all duration-200 hover:scale-[1.01] hover:bg-gray-200"
                        onclick={() => selectField(record, field)}
                        
                        class:bg-gray-300={selectedFieldId === field.field_id}
                        class:ring-2={selectedFieldId === field.field_id}
                        class:ring-teal-500={selectedFieldId === field.field_id}
                    >
                        <span class="font-medium text-gray-800">{record.title} - {field.field_name}</span>
                        <span class="text-xs text-gray-500">
                            {field.field_action ? ` (${field.field_action})` : ''}
                        </span>
                    </li>
                {/each}
            </ul>
        {/each}

        {#if filteredRecords().length === 0 && $records.length > 0}
            <div class="p-4 text-center text-gray-500 mt-4">
                No records or fields match "{filterTerm}"
            </div>
        {/if}
    </div>
</aside>