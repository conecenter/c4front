import React, { ReactElement } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSyncProviders } from "../../main/vdom-hooks";
import { FocusAnnouncerElement } from "../../extra/focus-announcer";
import { PopupManager } from "../../extra/popup-elements/popup-manager";
import { mainMenuComponents } from "../../extra/main-menu/main-menu-bar";
import { UserLocaleProvider } from "../../extra/locale";
import { TEST_LOCALE } from "../datepicker/test-locale";
import type { SendPatch } from "../../extra/exchange/patch-sync";

const { MainMenuClock, MenuExecutableItem, MenuFolderItem, MenuItemsGroup } = mainMenuComponents;

const POPUP_MANAGER_IDENTITY = { key: "popup-manager" };
const FOCUS_ANNOUNCER_IDENTITY = { key: "focus-announcer" };
const FOLDER_IDENTITY = { key: "folder" };
const FIRST_ITEM_IDENTITY = { key: "first-item" };
const SECOND_ITEM_IDENTITY = { key: "second-item" };

const FIRST_PATH = "/menu/first";
const SECOND_PATH = "/menu/second";
const FOCUS_ANNOUNCER_PATH = "/focus-announcer";

const SyncProviders = createSyncProviders;
const enqueue = jest.fn<number, [object, SendPatch]>(() => 1);
const sender = { enqueue, ctxToPath: () => FOCUS_ANNOUNCER_PATH };

const executableItem = (
    identity: object,
    path: string,
    name: string
) => (
    <MenuExecutableItem
        key={path}
        identity={identity}
        path={path}
        name={name}
        current={false}
        receiver={true}
        bindSrcId={`${path}-bind`}
    />
);

function withProviders(children: ReactElement) {
    return (
        <SyncProviders sender={sender} ack={null} isRoot={true} branchKey="">
            <FocusAnnouncerElement
                identity={FOCUS_ANNOUNCER_IDENTITY}
                value={FOCUS_ANNOUNCER_PATH}
                receiver={true}
            >
                {[
                    <PopupManager key="popup-manager" identity={POPUP_MANAGER_IDENTITY} openedPopups={[]}>
                        {[children]}
                    </PopupManager>
                ]}
            </FocusAnnouncerElement>
        </SyncProviders>
    );
}

function folder(opened: boolean, children: ReactElement[]) {
    return (
        <MenuFolderItem
            key="folder"
            identity={FOLDER_IDENTITY}
            path="/menu/tools"
            name="Tools"
            current={false}
            state={{ opened }}
            receiver={true}
            bindSrcId="tools-bind"
            groupId="tools-group"
        >
            {children}
        </MenuFolderItem>
    );
}

function menuItem(name: string) {
    const item = screen.getByText(name).closest<HTMLElement>(".menuItem");
    if (!item) throw new Error(`Menu item '${name}' not found`);
    return item;
}

describe("main menu critical paths", () => {
    afterEach(() => jest.useRealTimers());

    it("executes a nested item without toggling its ancestor folder", async () => {
        render(withProviders(
            folder(true, [executableItem(FIRST_ITEM_IDENTITY, FIRST_PATH, "Run report")])
        ));

        await screen.findByText("Run report");
        await act(() => userEvent.setup().click(screen.getByText("Run report")));

        expect(enqueue).toHaveBeenCalledWith(
            expect.objectContaining({ parent: FIRST_ITEM_IDENTITY, key: "receiver" }),
            expect.objectContaining({
                value: "",
                headers: expect.objectContaining({ "x-r-action": "click" })
            })
        );
        expect(enqueue).not.toHaveBeenCalledWith(
            expect.objectContaining({ parent: FOLDER_IDENTITY, key: "receiver" }),
            expect.anything()
        );
    });

    it("opens, navigates grouped items with wrapping, and closes by keyboard", async () => {
        const user = userEvent.setup();
        const children = [
            <MenuItemsGroup key="group">
                {[executableItem(FIRST_ITEM_IDENTITY, FIRST_PATH, "First action")]}
            </MenuItemsGroup>,
            executableItem(SECOND_ITEM_IDENTITY, SECOND_PATH, "Second action")
        ];
        const app = (opened: boolean) => withProviders(folder(opened, children));
        const { rerender } = render(app(false));
        const folderItem = menuItem("Tools");
        act(() => folderItem.focus());
        await act(() => user.keyboard("{Enter}"));
        expect(enqueue).toHaveBeenCalledWith(
            expect.objectContaining({ parent: FOLDER_IDENTITY, key: "receiver" }),
            expect.objectContaining({ headers: expect.objectContaining({ "x-r-opened": "1" }) })
        );

        rerender(app(true));
        await waitFor(() => expect(menuItem("First action")).toHaveFocus());

        await act(() => user.keyboard("{ArrowDown}"));
        expect(menuItem("Second action")).toHaveFocus();

        await act(() => user.keyboard("{ArrowDown}"));
        expect(menuItem("First action")).toHaveFocus();

        await act(() => user.keyboard("{Escape}"));
        expect(folderItem).toHaveFocus();
        expect(enqueue).toHaveBeenCalledWith(
            expect.objectContaining({ parent: FOLDER_IDENTITY, key: "receiver" }),
            expect.objectContaining({ headers: expect.objectContaining({ "x-r-opened": "" }) })
        );
    });

    it("shows server time in the user's timezone and keeps ticking", () => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2026-01-15T12:34:56Z"));

        render(
            <SyncProviders sender={sender} ack={null} isRoot={true} branchKey="">
                <UserLocaleProvider identity={{ key: "locale" }} locale={TEST_LOCALE}>
                    {[
                        <MainMenuClock
                            key="clock"
                            identity={{ key: "clock" }}
                            timeSync={true}
                            serverTime={Date.now().toString()}
                            timestampFormatId={11967}
                            path="/menu/clock"
                        />
                    ]}
                </UserLocaleProvider>
            </SyncProviders>
        );

        expect(screen.getByText("15/01/2026")).toBeInTheDocument();
        expect(screen.getByText("13:34:56")).toBeInTheDocument();

        act(() => jest.advanceTimersByTime(1000));
        expect(screen.getByText("13:34:57")).toBeInTheDocument();
    });
});