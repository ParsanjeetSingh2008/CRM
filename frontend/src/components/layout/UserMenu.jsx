import * as Menu from '@radix-ui/react-dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useLogout } from '../../hooks/useAuth'
import { initials } from '../../lib/format'

/** Avatar button with the account's name/email and a Log out item. */
export function UserMenu({ user }) {
  const [open, setOpen] = useState(false)
  const logout = useLogout()

  const handleLogout = () =>
    logout.mutate(undefined, {
      onSuccess: () => toast.success('Logged out'),
      onError: () => toast.error('Logged out on this device, but the server could not be reached.'),
    })

  return (
    <Menu.Root open={open} onOpenChange={setOpen}>
      <Menu.Trigger
        className="flex items-center gap-2 rounded-xl py-1 pr-2 pl-1 transition-colors hover:bg-surface-muted"
        aria-label={`Account menu for ${user.name}`}
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-new-soft text-xs font-bold text-new">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold text-ink md:block">{user.name}</span>
        <ChevronDown className="hidden size-4 text-ink-faint md:block" aria-hidden="true" />
      </Menu.Trigger>

      <AnimatePresence>
        {open && (
          <Menu.Portal forceMount>
            <Menu.Content asChild align="end" sideOffset={8} forceMount>
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="z-50 w-60 rounded-2xl bg-white p-1.5 ring-1 ring-line focus:outline-none"
              >
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink-soft">{user.email}</p>
                </div>
                <Menu.Separator className="my-1 h-px bg-line" />
                <Menu.Item
                  onSelect={handleLogout}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none data-[highlighted]:bg-danger-soft data-[highlighted]:text-danger"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  Log out
                </Menu.Item>
              </motion.div>
            </Menu.Content>
          </Menu.Portal>
        )}
      </AnimatePresence>
    </Menu.Root>
  )
}
