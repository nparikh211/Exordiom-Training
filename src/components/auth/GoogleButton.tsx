import { Button } from '@/components/ui/button';

interface GoogleButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function GoogleButton({ onClick, disabled }: GoogleButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={disabled}
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5 mr-2"
      />
      Sign in with Google
    </Button>
  );
}