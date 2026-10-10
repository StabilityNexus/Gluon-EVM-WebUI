# Social sharing

Gluon's footer uses AOSSIE's [SocialShareButton](https://social-share-button.aossie.org/)
through the pinned `@aossie-org/social-share-button@1.0.4` npm package.
The existing `ShareModal` component integrates the official widget; it does not
maintain a second implementation of platform share URLs.

## Placement and appearance

The **Share Gluon** action sits beside Terms of Use in the global footer,
after the community links. It is available on every page and stays separate
from wallet connection, reactor deployment, and conversion actions.

The widget uses Gluon's typography, surface colors, borders, focus rings,
and button styling through `styles/social-share.css`. The platform grid fits
mobile screens and follows the site's current light or dark theme.

## Behavior

- The widget's JavaScript is bundled locally and loaded when sharing opens.
  No CDN script or application backend is required at runtime.
- It shares the current page URL and title. Reactor links retain their `coin`
  query parameter; reopening reads the current page again.
- Platform actions open a share intent for the user to complete. They do not
  publish a post automatically. Discord uses the library's copy-and-open flow.
- Copy feedback appears inline. Widget analytics are disabled.
- A native modal dialog contains the widget, manages keyboard focus and
  background interaction, and returns focus to the trigger when dismissed.
- Closing or unmounting destroys the widget, removes its listeners and modal,
  and releases its scroll lock. Loading failures offer retry and close actions.

## Manual verification

1. Open Home, Explorer, Create, and a valid reactor URL.
2. Scroll to the footer and open Share Gluon.
3. Check the modal in light and dark themes, on desktop and a narrow viewport.
4. Use Tab and Shift+Tab to confirm focus stays inside the dialog.
5. Close with Escape, the close button, and the backdrop; confirm focus returns
   to Share Gluon and page scrolling works again.
6. Copy the link and verify the path and reactor query parameter.
7. Navigate to another page or reactor and reopen; verify the link updates.
8. Select a platform and inspect its draft without submitting a post.
