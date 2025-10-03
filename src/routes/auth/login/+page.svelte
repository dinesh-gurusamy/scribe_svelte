<script lang="ts">
    import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
    import { Button } from "$lib/components/ui/button/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { cn } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";
    import { goto } from '$app/navigation';
    import { enhance } from '$app/forms';

    let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();

</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-gray-200 p-6 md:p-10">
    <div class="flex w-full max-w-sm flex-col gap-6">
        <a href="##" class="flex items-center gap-2 self-center font-medium">
            <div
                class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
            >
                <GalleryVerticalEndIcon class="size-4" />
            </div>
            Acme Inc.
        </a>
        <div class={cn('flex flex-col gap-6', className)} {...restProps}>
            <Card.Root>
                <Card.Header class="text-center">
                    <Card.Title class="text-xl">Welcome back</Card.Title>
                    <Card.Description>Login with your Google account</Card.Description>
                </Card.Header>
                <Card.Content>
                    <form 
                    method='POST'
                    action="?/login"
                    use:enhance={() => {
                                        return async ({ result }) => {
                                            if (result.type === 'success') {
                                                // Handle success redirect
                                                goto('/dashboard');
                                                alert('User Logged in successfully!');
                                            } else {
                                                // Handle error case
                                                // result.data?.message will contain the error message from fail(400, { message: ... })
                                                const errorMessage = 'Error submitting form';
                                                alert(errorMessage);
                                            }
                                        };
                                    }}
                    >
                        <div class="grid gap-6">
                            <div class="flex flex-col gap-4">
                                <Button variant="outline" class="w-full" onclick={()=>goto('/login/google')}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
                                    Continue with Google
								</Button>
                            </div>
                            <div
                                class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
                            >
                                <span class="relative z-10 bg-card px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                            <div class="grid gap-6">
                                <div class="grid gap-3">
                                    <Label for="email">Email</Label>
                                    <Input name="email" type="email" placeholder="m@example.com" required />
                                </div>
                                <div class="grid gap-3">
                                    <div class="flex items-center">
                                        <Label for="password">Password</Label>
                                        <a href="##" class="ml-auto text-sm underline-offset-4 hover:underline">
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <Input name="password" type="password" required />
                                </div>
                                <Button type="submit" class="w-full">Login</Button>
                            </div>
                            <div class="text-center text-sm">
                                I Don't have an account?
                                <a href="/auth/signup" class="underline underline-offset-4"> Sign up </a>
                            </div>
                        </div>
                    </form>
                </Card.Content>
            </Card.Root>
            <div
                class="text-center text-xs text-balance text-muted-foreground *:[a]:underline *:[a]:underline-offset-4 *:[a]:hover:text-primary"
            >
                By clicking continue, you agree to our <a href="##">Terms of Service</a>
                and <a href="##">Privacy Policy</a>.
            </div>
        </div>
    </div>
</div>