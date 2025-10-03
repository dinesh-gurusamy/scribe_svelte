<script lang="ts">
    // --- TYPE DEFINITIONS (Assuming these from your main layout and table structure) ---
    type AdditionalImage = {
        additional_image_id: number;
        parent_image_id: number;
        additional_image_url: string;
        additional_image_number: number | null;
    };

    type Image = {
        image_id: number;
        image_number: number;
        image_url: string;
        additional_images: AdditionalImage[];
    };

    type RecordItem = {
        title: string;
        fields: any[]; // Simplified for this component
        images: Image[];
    };
    
    // --- PROPS ---
    let {
        selectedRecord, // RecordItem type
        selectedImage, // Image type
        selectedImageNumber = $bindable(),
        changeImage,
        scale = $bindable(),
        rotation = $bindable(),
        translateX = $bindable(),
        translateY = $bindable(), 
        isDragging = $bindable()
    } = $props();

    // --- LOCAL STATE ---
    let container = $state<HTMLDivElement>();

    // State for drag operations
    let dragStartX = $state(0);
    let dragStartY = $state(0);
    let startTranslateX = $state(0);
    let startTranslateY = $state(0);
    const dragSensitivity = 1;

    // State for modal
    let isAdditionalImagesOpen = $state(false);

    // State for main image source (allows swapping between original and detail image URLs)
    let currentImageUrl = $state(selectedImage?.image_url || '');

    // Effect to sync currentImageUrl when selectedImage changes (i.e., when changing image number via the tab bar)
    $effect(() => {
        if (selectedImage?.image_url) {
            currentImageUrl = selectedImage.image_url;
        } else {
            currentImageUrl = '';
        }
    });

    // Reset view when switching image via the top tabs
    $effect(() => {
        if (selectedImageNumber !== null) {
            scale = 1;
            rotation = 0;
            translateX = 0;
            translateY = 0;
        }
    });

    // --- CLAMP HELPERS ---
    function clamp(value: number, min: number, max: number) {
        return Math.min(Math.max(value, min), max);
    }

    function clampPosition(currentX: number, currentY: number) {
        if (!container) return { x: 0, y: 0 };

        const rect = container.getBoundingClientRect(); 
        const maxPanX = (rect.width * scale - rect.width) / 2;
        const maxPanY = (rect.height * scale - rect.height) / 2;

        return {
            x: clamp(currentX, -maxPanX, maxPanX),
            y: clamp(currentY, -maxPanY, maxPanY)
        };
    }

    // --- DRAG HANDLERS ---
    function startDrag(e: MouseEvent) {
        if (e.button !== 0 || scale <= 1) return;

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startTranslateX = translateX;
        startTranslateY = translateY;

        function handleMove(ev: MouseEvent) {
            if (!isDragging) return;

            const dx = (ev.clientX - dragStartX) * dragSensitivity;
            const dy = (ev.clientY - dragStartY) * dragSensitivity; 

            const { x, y } = clampPosition(startTranslateX + dx, startTranslateY + dy); 
            translateX = x;
            translateY = y;
        }

        function handleUp() {
            isDragging = false; 
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        }

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    } 

    // --- IMAGE CONTROL FUNCTIONS ---
    function resetView() {
        scale = 1;
        rotation = 0;
        translateX = 0;
        translateY = 0;
    }

    function rotateLeft() {
        rotation -= 90; 
        const { x, y } = clampPosition(0, 0);
        translateX = x;
        translateY = y;
    }

    function rotateRight() {
        rotation += 90; 
        const { x, y } = clampPosition(0, 0);
        translateX = x;
        translateY = y;
    }

    function zoom(delta: number) {
        const newScale = Math.min(Math.max(scale + delta, 1), 4);
        if (newScale !== scale) {
            scale = newScale;

            if (scale === 1) {
                translateX = 0;
                translateY = 0;
            } else {
                const { x, y } = clampPosition(translateX, translateY);
                translateX = x;
                translateY = y;
            }
        }
    }

    function zoomIn() {
        zoom(0.2);
    }

    function zoomOut() {
        zoom(-0.2);
    }

    function handleScrollZoom(event: WheelEvent) {
        event.preventDefault();
        const delta = event.deltaY < 0 ? 0.1 : -0.1;
        zoom(delta);
    } 

    function selectAdditionalImage(url: string) {
        currentImageUrl = url;
        resetView();
        isAdditionalImagesOpen = false;
    }
</script>

<section
    class="col-span-8 flex flex-col items-center justify-start bg-white p-8 shadow-2xl"
>
    {#if selectedRecord}
        <ul class="flex flex-wrap justify-center gap-3 rounded-xl bg-gray-300 p-1">
            {#each selectedRecord.images as img (img.image_id)}
                <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li
                    class="cursor-pointer rounded-lg px-5 py-2 transition-all duration-200 hover:scale-[1.01] hover:bg-gray-400"
                    onclick={() => changeImage(img.image_number)}
                    class:bg-teal-100={selectedImageNumber === img.image_number}
                    class:ring-2={selectedImageNumber === img.image_number}
                    class:ring-teal-500={selectedImageNumber === img.image_number}
                >
                    <span class="text-sm font-medium text-gray-800">{img.image_number}</span>
                </li>
            {/each}
        </ul>

        {#if selectedImage}
            <div class="mb-4 flex w-full justify-between items-center">
                {#if selectedImage.additional_images && selectedImage.additional_images.length > 0}
                    <button
                        class="rounded-sm bg-teal-700   px-4 py-2 text-white shadow-md transition duration-200 hover:bg-teal-600"
                        onclick={() => (isAdditionalImagesOpen = true)}
                    >
                        Additional Images ({selectedImage.additional_images.length})
                    </button>
                {:else}
                    <p class="text-sm text-gray-500 font-medium px-4">No additional images available for this page.</p>
                {/if}

                <div
                    class="flex space-x-1 rounded-lg border border-gray-200 bg-white/70 p-1.5 shadow-xl backdrop-blur-sm"
                >
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="rounded-md bg-gray-300 p-2 text-gray-700 transition duration-200 hover:bg-gray-400" onclick={rotateLeft} title="Rotate Left">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 14l-4-4 4-4m-4 4h10a4 4 0 010 8H5a4 4 0 01-4-4v-1" />
                        </svg>
                    </button>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="rounded-md bg-gray-300 p-2 text-gray-700 transition duration-200 hover:bg-gray-400" onclick={rotateRight} title="Rotate Right (Clockwise)">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" style="transform: scaleY(-1);">
                            <path stroke-linecap="round" d="M12 10l4 4-4 4m4-4H4a4 4 0 010-8h15a4 4 0 014 4v1" />
                        </svg>
                    </button>
                    <div class="w-px bg-gray-400"></div>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="rounded-md bg-gray-300 p-2 text-gray-700 transition duration-200 hover:bg-gray-400" onclick={zoomIn} title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m-3-3h6" />
                        </svg>
                    </button>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="rounded-md bg-gray-300 p-2 text-gray-700 transition duration-200 hover:bg-gray-400" onclick={zoomOut} title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM9 12h6" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="relative h-[70vh] w-full">
                <div
                    bind:this={container}
                    class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-gray-300 bg-gray-100"
                    onwheel={handleScrollZoom}
                >
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <!-- svelte-ignore a11y_img_redundant_alt -->
                    <img
                        src={currentImageUrl}
                        alt="Record Image"
                        draggable="false"
                        class="max-h-full max-w-full border-gray-400 object-contain shadow-md select-none"
                        style="transform: translate({translateX}px, {translateY}px) scale({scale}) rotate({rotation}deg);"
                        class:cursor-grab={scale > 1}
                        class:cursor-grabbing={isDragging}
                        onmousedown={startDrag}
                        ondblclick={resetView}
                    />
                </div>
            </div>
        {:else}
            <div class="flex h-full items-center justify-center">
                <p class="text-lg text-gray-500">No image available</p>
            </div>
        {/if}
    {:else}
        <div class="flex h-full items-center justify-center">
            <p class="text-lg text-gray-500">Select a field to see its images</p>
        </div>
    {/if}

    {#if isAdditionalImagesOpen && selectedImage}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onclick={() => (isAdditionalImagesOpen = false)}
        >
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div
                class="w-[90vw] max-w-7xl rounded-xl bg-white p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                onclick={()=>stopPropagation}
            >
                <div class="mb-4 flex items-center justify-between border-b pb-3">
                    <h3 class="text-xl font-bold text-gray-800">
                        Additional Images for Image {selectedImage.image_number}
                    </h3>
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="text-gray-500 hover:text-gray-700" onclick={() => (isAdditionalImagesOpen = false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="flex space-x-4 overflow-x-auto pb-4">
                    <div
                        class="w-80 flex-shrink-0 cursor-pointer rounded-lg border-2 p-2 transition duration-150 hover:border-teal-500"
                        onclick={() => selectAdditionalImage(selectedImage.image_url)}
                        class:border-teal-500={currentImageUrl === selectedImage.image_url}
                        class:border-gray-200={currentImageUrl !== selectedImage.image_url}
                    >
                        <!-- svelte-ignore a11y_img_redundant_alt -->
                        <img
                            src={selectedImage.image_url}
                            alt="Original Image"
                            class="h-80 w-full rounded-md bg-gray-100 object-contain"
                        />
                        <p class="mt-2 text-center text-sm font-semibold text-gray-700">
                            Original ({selectedImage.image_number})
                        </p>
                    </div>

                    {#each selectedImage.additional_images as aImg (aImg.additional_image_id)}
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div
                            class="w-80 flex-shrink-0 cursor-pointer rounded-lg border-2 p-2 transition duration-150 hover:border-teal-500"
                            onclick={() => selectAdditionalImage(aImg.additional_image_url)}
                            class:border-teal-500={currentImageUrl === aImg.additional_image_url}
                            class:border-gray-200={currentImageUrl !== aImg.additional_image_url}
                        >
                            <img
                                src={aImg.additional_image_url}
                                alt={`Additional Image ${aImg.additional_image_number}`}
                                class="h-80 w-full rounded-md bg-gray-100 object-contain"
                            />
                            <p class="mt-2 text-center text-sm text-gray-700">
                                Detail {aImg.additional_image_number ?? ''}
                            </p>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</section>