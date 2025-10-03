<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { LayoutProps } from './$types'; // 🚨 ASSUMED TYPE IMPORTS (These need to be in your '$lib/server/db/types' file)

	// NOTE: For this code to compile, you must have the following types defined:
	// type RecordItem = { title: string; fields: Field[]; images: Image[] };
	// type Field = { field_id: string | number; field_name: string; field_action: 'YES' | 'NO' | null };
	// type Image = { image_number: number };
	type RecordItem = any;
	type Field = any;
	type Image = any;

	let { data, children }: LayoutProps = $props(); // Store import: Records are loaded via an API call filtered by user ID

	import { records, loadRecords, setFieldAction } from '$lib/stores/records'; // Component Imports

	import Sidebar from './Sidebar.svelte';
	import ReviewPanel from './ReviewPanel.svelte';
	import ImageViewer from './ImageViewer.svelte'; // --- Derived State from URL ---

	const recordSlug = $derived($page.params.record_slug as string);
	const fieldSlug = $derived($page.params.field_slug as string);
	const routeImageNumber = $derived(parseInt(($page.params.image_number as string) ?? '1', 10)); // --- Core Reactive State ($state) ---
	// Use the custom RecordItem type

	let selectedRecord = $state<RecordItem | null>(null); // Use the custom Field type
	let selectedField = $state<Field | null>(null); // The Field ID is derived from selectedField, so we don't need it as separate $state
	// let selectedFieldId = $state<string | number | null>(null);
	let selectedImage = $state<Image | null>(null);
	let selectedImageNumber = $state<number | null>(null);
	let isActionLocked = $state(false); // --- Image Manipulation State ---

	let scale = $state(1);
	let rotation = $state(0);
	let translateX = $state(0);
	let translateY = $state(0);
	let isDragging = $state(false);
	let lastX = $state(0);
	let lastY = $state(0); // --- CRITICAL: Synchronization Effect ---
	// Runs whenever $records or URL parameters change

	$effect(() => {
		// If records haven't loaded yet, or if URL is incomplete, stop.
		if (!$records.length || !recordSlug || !fieldSlug) return; // 1. Find the Record based on the slug

		const record = $records.find((r) => r.title?.toLowerCase().replace(/\s+/g, '-') === recordSlug);
		if (!record) {
			// Handle case where record doesn't exist (e.g., redirect to main dashboard)
			// goto('/dashboard');
			return;
		} // 2. Find the Field based on the slug

		const field =
			record.fields.find((f) => f.field_name?.toLowerCase().replace(/\s+/g, '-') === fieldSlug) ||
			null; // 3. Find the Image based on the URL number
		const image = record.images.find((img) => img.image_number === routeImageNumber) || null; // 4. Update local state

		selectedRecord = record;
		selectedField = field;
		selectedImage = image;
		selectedImageNumber = routeImageNumber; // 5. Update derived states

		isActionLocked = field?.field_action !== null; // Reset image transformation if the image number changes via the URL
		// (The logic here seems slightly redundant but preserves original intent)

		if (selectedImageNumber !== routeImageNumber) {
			scale = 1;
			rotation = 0;
			translateX = 0;
			translateY = 0;
		}
	}); // --- Image Reset Effect (Simplified from original second $effect) ---
	// Reset translation/scale when image number changes

	$effect(() => {
		if (selectedImageNumber) {
			scale = 1;
			translateX = 0;
			translateY = 0;
		}
	}); // --- Lifecycle Hook ---
	// This calls the loadRecords service function, which executes the API call
	// we updated in the previous step (filtering by user_id).

	onMount(loadRecords); // --- Functions ---

	function selectField(record: RecordItem, field: Field) {
		// ... (Logic remains correct for navigation)
		const initialImageNumber = (field.field_name.charCodeAt(0) - 64) * 2;
		const rSlug = record.title.toLowerCase().replace(/\s+/g, '-');
		const fSlug = field.field_name.toLowerCase().replace(/\s+/g, '-');
		const url = `/dashboard/${rSlug}/${fSlug}/${initialImageNumber}`;

		goto(url, { replaceState: true });
		rotation = 0;
	}

	function handleAction(action: 'YES' | 'NO') {
		if (selectedField && selectedRecord && !isActionLocked) {
			// 1. Call API to set action
			setFieldAction(selectedField.field_id, action); // 2. Local state update
			selectedField = { ...selectedField, field_action: action };
			isActionLocked = true; // 3. Find current field and record indices

			const currentFieldIndex = selectedRecord.fields.findIndex(
				(f) => f.field_id === selectedField?.field_id
			);
			const currentRecordIndex = $records.findIndex((r) => r.title === selectedRecord?.title); // 4. Determine next navigation target

			if (currentFieldIndex !== -1 && currentFieldIndex < selectedRecord.fields.length - 1) {
				// A. Move to the next field in the current record
				const nextField = selectedRecord.fields[currentFieldIndex + 1];
				selectField(selectedRecord, nextField);
			} else if (currentRecordIndex !== -1 && currentRecordIndex < $records.length - 1) {
				// B. Current field is the last one: Move to the first field of the next record
				const nextRecord = $records[currentRecordIndex + 1];
				if (nextRecord.fields.length > 0) {
					const firstFieldOfNextRecord = nextRecord.fields[0];
					selectField(nextRecord, firstFieldOfNextRecord);
				}
			} else {
				// C. All records and fields are completed
				console.log('All records completed!');
				// Optionally navigate to a dashboard/completed page:
				// goto('/dashboard');
			}
		}
	}

	function changeImage(num: number) {
		if (!selectedRecord || !selectedField) return;

		const rSlug = selectedRecord.title.toLowerCase().replace(/\s+/g, '-');
		const fSlug = selectedField.field_name.toLowerCase().replace(/\s+/g, '-');
		const url = `/dashboard/${rSlug}/${fSlug}/${num}`;

		goto(url, { replaceState: true });
	} // ... (Drag/Zoom functions remain the same)

	function startDrag(event: MouseEvent) {
		if (scale <= 1) return;
		isDragging = true;
		lastX = event.clientX;
		lastY = event.clientY;
	}

	function onDrag(event: MouseEvent) {
		if (!isDragging) return;
		const dx = event.clientX - lastX;
		const dy = event.clientY - lastY;
		translateX += dx;
		translateY += dy;
		lastX = event.clientX;
		lastY = event.clientY;
	}

	function stopDrag() {
		isDragging = false;
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-gray-200 font-sans text-gray-800">
	<header
		class="flex h-16 w-full flex-shrink-0 items-center justify-between border-b-4 border-teal-500 bg-white px-4 shadow-md"
	>
		<h1 class="text-3xl font-extrabold text-black">
			Hi, {data.user.username}! 👋
		</h1>
		<h1 class="text-3xl font-extrabold text-gray-800">
			<span class="text-teal-600">Review</span> App
		</h1>
		<form method="post" action="/dashboard?/logout" use:enhance>
			<button
				class="w-full rounded-xl bg-teal-100 px-4 py-2 font-semibold text-gray-900 shadow-lg shadow-white/10 transition duration-150 ease-in-out hover:bg-gray-200"
			>
				Sign out
			</button>
		</form>
	</header>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="grid flex-grow grid-cols-12 overflow-hidden"
		onmouseup={stopDrag}
		onmousemove={onDrag}
		onmouseleave={stopDrag}
	>
		<Sidebar records={$records} {selectField} selectedFieldId={selectedField?.field_id || null} />

		<ReviewPanel bind:selectedField {handleAction} {isActionLocked} />

		<ImageViewer
			bind:scale
			bind:rotation
			bind:translateX
			bind:translateY
			bind:isDragging
			{selectedRecord}
			{selectedImage}
			bind:selectedImageNumber
			{changeImage}
			{startDrag}
		/>
		<div class="col-span-12 overflow-hidden">
			{@render children()}
		</div>
	</div>
</div>
