<script lang="ts">
    

    // Props received from the parent layout
    let { selectedField, handleAction, isActionLocked } = $props();

    // --- Component State ---
    // Local state to hold the action (YES/NO) before submission
    let pendingAction = $state<'YES' | 'NO' | null>(null);

    // Derived state to check if the field has already been finalized
    const isReviewed = $derived(selectedField?.field_action !== null);

    // --- Effects ---
    // Reset or set pendingAction when a new field is selected
    $effect(() => {
        // When selectedField changes, update pendingAction to reflect the current saved state
        pendingAction = selectedField?.field_action ?? null;
    });

    // --- Handlers ---
    
    /** Sets the temporary action when YES/NO radio buttons are used. */
    function setPendingAction(action: 'YES' | 'NO') {
        if (!isReviewed) {
            pendingAction = action;
        }
    }

    /** Commits the pending action by calling the parent's handleAction function. */
    function handleSubmit() {
        if (selectedField && pendingAction && !isReviewed) {
            // 1. Call the parent function to commit the action (updates global store)
            handleAction(pendingAction);

            // The parent component should handle updating the bound 'selectedField' 
            // after the action is processed, which will cause 'isActionLocked' 
            // and 'isReviewed' to update reactively.
        }
    }
</script>

<main class="col-span-2 mx-2  flex flex-col justify-start  bg-white p-5 shadow-lg">
    {#if selectedField}
        <h2 class="mb-4 text-2xl font-extrabold text-gray-800">
            Review: <span class="text-teal-600">{selectedField.field_name}</span>
        </h2>
        
        <p class="mb-4 text-gray-600">
            Status:
            <span class="font-bold {isReviewed ? 'text-green-700' : 'text-orange-500'}">
                {isReviewed ? 'Reviewed' : 'Pending Selection'}
            </span>
        </p>

        <div class="mb-6 flex items-center space-x-6">
            <label
                class="flex cursor-pointer items-center transition-colors duration-200"
                class:hover:text-green-600={!isActionLocked}
                class:opacity-50={isActionLocked && pendingAction !== 'YES'}
            >
                <input
                    type="radio"
                    name="action-select"
                    value="YES"
                    bind:group={pendingAction}
                    onchange={() => setPendingAction('YES')}
                    disabled={isActionLocked}
                    class="hidden"
                />
                <span
                    class="mr-2 h-4 w-4 rounded-full border-2 transition-all duration-200"
                    class:border-green-600={pendingAction === 'YES'}
                    class:border-gray-500={pendingAction !== 'YES'}
                    class:bg-green-500={pendingAction === 'YES'}
                ></span>
                <span class="font-medium text-gray-700">YES</span>
            </label>
            
            <label
                class="flex cursor-pointer items-center transition-colors duration-200"
                class:hover:text-red-600={!isActionLocked}
                class:opacity-50={isActionLocked && pendingAction !== 'NO'}
            >
                <input
                    type="radio"
                    name="action-select"
                    value="NO"
                    bind:group={pendingAction}
                    onchange={() => setPendingAction('NO')}
                    disabled={isActionLocked}
                    class="hidden"
                />
                <span
                    class="mr-2 h-4 w-4 rounded-full border-2 transition-all duration-200"
                    class:border-red-600={pendingAction === 'NO'}
                    class:border-gray-500={pendingAction !== 'NO'}
                    class:bg-red-500={pendingAction === 'NO'}
                ></span>
                <span class="font-medium text-gray-700">NO</span>
            </label>
        </div>

        <button
            class="px-4 py-3 rounded-xl font-bold transition-colors duration-200 shadow-md flex-shrink-0"
            class:bg-teal-500={!isReviewed && pendingAction}
            class:hover:bg-teal-600={!isReviewed && pendingAction}
            class:text-white={!isReviewed && pendingAction}
            class:bg-gray-300={!pendingAction && !isReviewed}
            class:text-gray-500={!pendingAction && !isReviewed}
            class:bg-gray-400={isReviewed}
            class:text-gray-700={isReviewed}
            onclick={handleSubmit}
            disabled={isReviewed || pendingAction === null}
        >
            {#if isReviewed}
                Submitted: {selectedField.field_action}
            {:else if pendingAction}
                Submit Review ({pendingAction})
            {:else}
                Select YES or NO
            {/if}
        </button>
        
        {#if isReviewed}
            <p class="mt-4 text-sm text-gray-500">
                Action is locked.
            </p>
        {/if}

    {:else}
        <div class="flex h-full items-center justify-center">
            <p class="text-lg text-gray-500">Select a field from the sidebar to review.</p>
        </div>
    {/if}
</main>