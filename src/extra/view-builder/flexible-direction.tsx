import React, {createElement as el, ReactNode, useContext} from "react";

const F_COLUMN = 'c'
const F_ROW = 'r'
type FlexibleDirection = 'c' | 'r'

const FlexibleDirectionContext = React.createContext<FlexibleDirection>(F_COLUMN);

function provideColumn(children: ReactNode[]) {
  return <FlexibleDirectionContext.Provider value={F_COLUMN}>{children}</FlexibleDirectionContext.Provider>
}

function provideRow(children: ReactNode[]) {
  return <FlexibleDirectionContext.Provider value={F_ROW}>{children}</FlexibleDirectionContext.Provider>
}

function useFDirectionIsColumn() {
  return useContext(FlexibleDirectionContext) === F_COLUMN
}
