<script>
	import { goto } from "$app/navigation";

	function handleSignup() {
		goto("/auth/signup");
	}

	function handleLogin() {
		goto("/auth/login");
	}
</script>

<!-- Full-page container with black background + radial gradient -->
<div
	class="min-h-screen flex items-center justify-center bg-gray-200 font-sans"
>
	<div
		id="app-container"
		class="w-full max-w-lg mx-auto p-8 sm:p-12 bg-gray-900 shadow-2xl rounded-2xl border border-gray-700"
	>
		<!-- Header -->
		<div class="text-center mb-10">
			<div
				class="inline-block p-3 mb-4 rounded-xl bg-gray-700/50 text-white border border-gray-600"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 7a2 2 0 012 2v10a2 2 0 
						01-2 2H9a2 2 0 01-2-2V9a2 2 0 
						012-2h6zm0 0V5a2 2 0 00-2-2H9a2 
						2 0 00-2 2v2m6 0h.01M15 7H9"
					/>
				</svg>
			</div>

			<h1 class="text-4xl font-extrabold text-white mb-3 tracking-tight">
				AuthApp
			</h1>

			<p class="text-lg text-gray-400 font-light max-w-md mx-auto">
				Secure access through a clean, reliable, and professional portal.
			</p>
		</div>

		<!-- Buttons -->
		<div class="space-y-4">
			<button
				on:click={handleSignup}
				class="w-full flex items-center justify-center px-8 py-3 text-base font-semibold rounded-xl text-gray-900 bg-white hover:bg-gray-200 md:py-4 md:text-lg transition duration-150 ease-in-out shadow-xl shadow-white/10"
			>
				Create Account
			</button>

			<button
				on:click={handleLogin}
				class="w-full flex items-center justify-center px-8 py-3 border-2 border-gray-500 text-base font-semibold rounded-xl text-gray-300 bg-gray-900 hover:bg-gray-800 md:py-4 md:text-lg transition duration-150 ease-in-out"
			>
				Log In to Existing Account
			</button>
		</div>

		<!-- Footer -->
		<div class="mt-12 text-center text-sm text-gray-600">
			<p>
				&copy; 2025 AuthApp. All rights reserved. |
				<a href="#" class="hover:underline text-gray-500">Privacy & Terms</a>
			</p>
		</div>
	</div>
</div>
