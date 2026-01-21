import { type ActionFunctionArgs, redirect } from 'react-router-dom';
import { store } from '@/app/store';
import { loginThunk } from './authThunks';
import { toast } from 'react-toastify';

export const loginAction = async ({ request }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
        await store.dispatch(loginThunk({ email, password })).unwrap();
        toast.success("Login successfully!");
        return redirect('/market');
    } catch (error: any) {
        return { error: error || "Login failed" };
    }
};
