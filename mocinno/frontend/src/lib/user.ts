import { createContext } from 'svelte';
import authClient from './auth';
import { type RouterOutput } from './trpc';

export const [getUserContext, setUserContext] =
	createContext<() => typeof authClient.$Infer.Session>();

export const [getContainerContext, setContainerContext] =
	createContext<() => RouterOutput['user']['container']>();
