import isDropdownUpwards   from './shared/layout.js';
import MyFilters           from './filters.js';
import MyForm              from './form.js';
import MyInputCollection   from './inputCollection.js';
import MyInputOffset       from './inputOffset.js';
import MyListAggregate     from './listAggregate.js';
import MyListColumnBatch   from './listColumnBatch.js';
import MyListCsv           from './listCsv.js';
import MyListFilters       from './listFilters.js';
import MyListOptions       from './listOptions.js';
import MyValueRich         from './valueRich.js';
import {consoleError}      from './shared/error.js';
import {getCaption}        from './shared/language.js';
import {layoutSettleSpace} from './shared/layout.js';
import {isAttributeFiles}  from './shared/attribute.js';
import {
	getColumnBatches,
	getColumnTitle,
	getOrderIndexesFromColumnBatch
} from './shared/column.js';
import {
	fieldOptionGet,
	fieldOptionSet
} from './shared/field.js';
import {
	getChoiceFilters,
	getRowsDecrypted
} from './shared/form.js';
import {
	checkDataOptions,
	colorAdjustBg,
	colorMakeContrastFont,
	deepIsEqual
} from './shared/generic.js';
import {
	fillRelationRecordIds,
	getFiltersEncapsulated,
	getQueryAttributesPkFilter,
	getQueryExpressions,
	getRelationsJoined
} from './shared/query.js';
import {
	routeChangeFieldReload,
	routeParseParams
} from './shared/router.js';
export {MyList as default};

let MyList = {
	name:'my-list',
	components:{
		MyFilters,
		MyInputCollection,
		MyInputOffset,
		MyListAggregate,
		MyListColumnBatch,
		MyListCsv,
		MyListFilters,
		MyListOptions,
		MyValueRich
	},
	template:`<div class="list" ref="content"
		v-click-outside="escape"
		@keydown="keyDown"
		:class="{ asInput:isInput, readonly:inputIsReadonly, isSingleField:isSingleField }"
	>
		<!-- hover menus -->
		<div class="app-sub-window"
			v-if="showHover"
			@click.self.stop="closeHover"
			:class="{'under-header':!isMobile}"
		>
			<div class="contentBox float scroll" :class="{ 'list-csv':showCsv, 'list-filters-wrap':showFilters, 'list-options':showOptions }">
				<div class="top lower">
					<div class="area">
						<img class="icon" :src="hoverIconSrc" />
						<div class="caption">{{ hoverCaption }}</div>
					</div>
					<my-button image="cancel.png"
						@trigger="closeHover"
						:blockBubble="true"
						:cancel="true"
					/>
				</div>
				<div class="content grow default-inputs" :class="{ 'no-padding':showOptions }">
					<my-list-csv
						v-if="showCsv"
						@reload="get"
						:columns="columns"
						:columnBatches="columnBatches"
						:filters="filtersCombined"
						:isExport="csvExport"
						:isImport="csvImport"
						:joins="relationsJoined"
						:orders="orders"
						:query="query"
					/>
					<my-list-filters
						v-if="showFilters"
						@set-filters="setUserFilters"
						:columns="columnsAll"
						:columnBatches="columnBatchesAll"
						:filters="filtersUser"
						:joins="joins"
					/>
					<my-list-options
						v-if="showOptions"
						@reset-columns="resetColumns"
						@set-auto-renew="setAutoRenewTimer"
						@set-cards-captions="setCardsCaptions"
						@set-column-batch-sort="setColumnBatchSort"
						@set-column-ids-by-user="$emit('set-column-ids-by-user',$event)"
						@set-layout="setLayout"
						@set-page-limit="setLimit"
						:autoRenew="autoRenew"
						:cardsCaptions="cardsCaptions"
						:columns="columns"
						:columnsAll="columnsAll"
						:columnBatches="columnBatches"
						:columnBatchSort="columnBatchSort"
						:csvImport="csvImport"
						:hasPaging="hasPaging"
						:layout="layout"
						:limitDefault="limitDefault"
						:moduleId="moduleId"
						:pageLimit="limit"
					/>
				</div>
			</div>
		</div>
		
		<!-- list as input field (showing record(s) from active field value) -->
		<template v-if="isInput">
			<div class="list-input-rows-wrap"
				@click="clickInputRow"
				:class="{ clickable:!inputMulti && !inputIsReadonly, 'multi-line':inputMulti }"
			>
				<table class="list-input-rows">
					<tbody>
						<tr v-for="(r,i) in rowsInput">
							
							<!-- icons -->
							<td class="minimum">
								<div class="list-input-row-items nowrap">
									
									<!-- either field/attribute icon or gallery file from first column -->
									<slot name="input-icon"
										v-if="!hasGalleryIcon || r.values[0] === null"
									/>
									<my-value-rich class="context-list-input"
										v-else
										@focus="focus"
										:alignEnd="columns[0].flags.alignEnd"
										:alignMid="columns[0].flags.alignMid"
										:attribute-id="columns[0].attributeId"
										:class="{ clickable:inputAsCategory && !inputIsReadonly }"
										:basis="columns[0].basis"
										:bold="columns[0].bold"
										:boolAtrIcon="columns[0].boolAtrIcon"
										:display="columns[0].display"
										:length="columns[0].length"
										:monospace="columns[0].flags.monospace"
										:value="r.values[0]"
										:wrap="columns[0].flags.wrap"
									/>
								</div>
							</td>
							
							<!-- category input check box -->
							<td class="minimum" v-if="inputAsCategory">
								<div class="list-input-row-checkbox">
									<my-button
										@trigger="inputTriggerRow(r)"
										:active="!inputIsReadonly"
										:image="displayRecordCheck(inputRecordIds.includes(r.indexRecordIds['0']))"
										:naked="true"
									/>
								</div>
							</td>
							
							<!-- values -->
							<td v-for="(b,bi) in columnBatches" :style="b.style">
								<div class="list-input-row-items">
									<template v-for="(ci,cii) in b.columnIndexes">
										<my-value-rich class="context-list-input"
											v-if="r.values[ci] !== null && (!hasGalleryIcon || bi !== 0 || cii !== 0)"
											@focus="focus"
											@trigger="inputTriggerRow(r)"
											:alignEnd="columns[ci].flags.alignEnd"
											:alignMid="columns[ci].flags.alignMid"
											:attribute-id="columns[ci].attributeId"
											:class="{ clickable:inputAsCategory && !inputIsReadonly }"
											:basis="columns[ci].basis"
											:bold="columns[ci].flags.bold"
											:boolAtrIcon="columns[ci].flags.boolAtrIcon"
											:clipboard="columns[ci].flags.clipboard"
											:display="columns[ci].display"
											:italic="columns[ci].flags.italic"
											:key="ci"
											:length="columns[ci].length"
											:monospace="columns[ci].flags.monospace"
											:value="r.values[ci]"
											:wrap="columns[ci].flags.wrap"
										/>
									</template>
								</div>
							</td>
							
							<!-- actions -->
							<td class="minimum">
								<div class="list-input-row-items nowrap justifyEnd">
									<my-button image="open.png"
										v-if="hasUpdate"
										@trigger="clickOpen(r,false)"
										@trigger-middle="clickOpen(r,true)"
										:blockBubble="true"
										:captionTitle="capApp.inputHintOpen"
										:naked="true"
									/>
									<my-button image="cancel.png"
										v-if="!inputAsCategory"
										@trigger="inputTriggerRowRemove(i)"
										:active="!inputIsReadonly"
										:captionTitle="capApp.inputHintRemove"
										:naked="true"
									/>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			
			<!-- empty record input field -->
			<table class="list-input-rows"
				v-if="showInputAddLine"
				@click="clickInputEmpty"
				:class="{ clickable:!inputIsReadonly }"
			>
				<tbody>
					<tr>
						<td class="minimum">
							<slot name="input-icon" />
						</td>
						<td>
							<div class="list-input-row-items">
								<input class="input" data-is-input="1" data-is-input-empty="1" enterkeyhint="send"
									@click="focus"
									@focus="focus"
									@keyup="updatedTextInput"
									v-model="filtersQuick"
									:class="{ invalid:!inputValid }"
									:disabled="inputIsReadonly"
									:placeholder="inputLinePlaceholder"
									:tabindex="!inputIsReadonly ? 0 : -1"
								/>
							</div>
						</td>
						<td class="minimum">
							<div class="list-input-row-items nowrap">
								<my-button image="add.png"
									v-if="!inputIsReadonly && hasCreate"
									@trigger="$emit('open-form',[],false)"
									@trigger-middle="$emit('open-form',[],true)"
									:blockBubble="true"
									:captionTitle="capApp.inputHintCreate"
									:naked="true"
								/>
								<my-button image="pageDown.png"
									:active="!inputIsReadonly"
									:naked="true"
								/>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</template>
		
		<!-- regular list view (either view or input dropdown) -->
		<template v-if="!isInput || (dropdownShow && !inputAsCategory)">
			
			<!-- list header -->
			<div class="list-header" v-if="header && showHeader">
				
				<div class="row gap nowrap">
					<slot name="input-icon" />
					
					<!-- record actions -->
					<my-button image="new.png"
						v-if="hasCreate"
						@trigger="$emit('open-form',[],false)"
						@trigger-middle="$emit('open-form',[],true)"
						:caption="showActionTitles ? capGen.button.new : ''"
						:captionTitle="capGen.button.newHint"
					/>
					<my-button image="edit.png"
						v-if="hasUpdateBulk && (selectedRows.length !== 0 || headerElements.includes('actionsReadonly'))"
						@trigger="selectRowsBulkEdit(selectedRows)"
						:active="selectedRows.length !== 0"
						:caption="showActionTitles ? capGen.button.editBulk.replace('{COUNT}',selectedRows.length) : '(' + String(selectedRows.length) + ')'"
						:captionTitle="capGen.button.editBulk.replace('{COUNT}',selectedRows.length)"
					/>
					<my-button image="fileSheet.png"
						v-if="csvImport || csvExport"
						@trigger="showCsv = !showCsv"
						:caption="showActionTitles ? capApp.button.csv : ''"
						:captionTitle="capApp.button.csvHint"
					/>
					<my-button image="shred.png"
						v-if="hasDeleteAny && (selectedRows.length !== 0 || headerElements.includes('actionsReadonly'))"
						@trigger="delAsk(selectedRows)"
						:active="selectedRows.length !== 0"
						:cancel="true"
						:caption="showActionTitles ? capGen.button.delete : ''"
						:captionTitle="capGen.button.deleteHint"
					/>
				</div>
				
				<!-- empty element for header collapse calculation -->
				<div ref="empty" class="empty"></div>
				
				<div class="row gap nowrap centered list-header-title" v-if="showTitle">
					<span v-if="caption !== ''">{{ caption }}</span>
				</div>
				
				<div class="row gap nowrap">
					<my-input-offset
						v-if="hasPaging"
						@input="offset = $event;reloadInside()"
						:arrows="showOffsetArrows"
						:caption="showResultsCount && count > 1"
						:limit="limit"
						:offset="offset"
						:total="count"
					/>
				</div>
				
				<div class="row gap nowrap default-inputs">
					<my-button
						v-if="showRefresh"
						@trigger="reloadInside('manual')"
						:captionTitle="capGen.button.refresh"
						:image="autoRenew === -1 ? 'refresh.png' : 'autoRenew.png'"
						:naked="true"
					/>
					
					<my-button image="filterCog.png"
						@trigger="toggleUserFilters"
						@trigger-right="setUserFilters([])"
						:caption="filtersUser.length !== 0 ? String(filtersUser.length) : ''"
						:captionTitle="capGen.button.filterHint"
						:naked="true"
					/>
					
					<input autocomplete="off" class="short" enterkeyhint="send" type="text"
						v-if="filterQuick"
						@keyup.enter="updatedFilterQuick"
						v-model="filtersQuick"
						:placeholder="capGen.threeDots"
						:title="capApp.quick"
					/>
					
					<my-input-collection
						v-for="c in collections"
						@update:modelValue="$emit('set-collection-indexes',c.collectionId,$event);resized()"
						:collectionId="c.collectionId"
						:columnIdDisplay="c.columnIdDisplay"
						:key="c.collectionId"
						:modelValue="collectionIdMapIndexes[c.collectionId]"
						:multiValue="c.flags.includes('multiValue')"
						:previewCount="showCollectionCnt"
						:showTitle="showCollectionTitles"
					/>
					
					<select class="dynamic"
						v-if="hasChoices"
						@change="reloadInside('choice')"
						v-model="choiceId"
					>
						<option v-for="c in query.choices" :value="c.id">
							{{ getCaption('queryChoiceTitle',moduleId,c.id,c.captions,c.name) }}
						</option>
					</select>
					
					<my-button image="listCog.png"
						@trigger="showOptions = !showOptions"
						:captionTitle="capGen.options"
						:naked="true"
					/>
					<my-button image="toggleUp.png"
						v-if="!isCards && headerElements.includes('headerCollapse')"
						@trigger="toggleHeader"
						:captionTitle="capApp.button.collapseHeader"
						:naked="true"
					/>
				</div>
			</div>
			
			<!-- list content -->
			<div class="list-content" :class="{ showsInlineForm:popUpFormInline !== null }">
			
				<!-- list results as table or card layout -->
				<div
					:class="{ layoutCards:isCards, layoutTable:isTable, rowsColored:settings.listColored, scrolls:isSingleField, 'input-dropdown-wrap':isInput, upwards:inputDropdownUpwards }"
					:id="usesPageHistory ? scrollFormId : null"
				>
					<table v-if="isTable" :class="{ asInput:isInput, 'input-dropdown':isInput, upwards:inputDropdownUpwards }">
						<thead v-if="header">
							<tr :class="{ atTop:!showHeader }">
								<th v-if="hasBulkActions" class="minimum checkbox">
									<img class="clickable" tabindex="0"
										@click="selectRowsAllToggle"
										@keyup.enter.space.stop="selectRowsAllToggle"
										:src="rows.length !== 0 && selectedRows.length === rows.length ? 'images/checkboxSmall1.png' : 'images/checkboxSmall0.png'"
									/>
								</th>
								<th v-for="(b,i) in columnBatches" :style="b.style">
									<my-list-column-batch
										@close="columnBatchIndexOption = -1"
										@del-aggregator="setAggregators"
										@del-order="setOrder(b,null)"
										@set-aggregator="setAggregators"
										@set-filters="setColumnBatchFilters"
										@set-order="setOrder(b,$event)"
										@toggle="clickColumn(i)"
										:columnBatch="b"
										:columnIdMapAggr="columnIdMapAggr"
										:columns="columns"
										:dropdownRight="(columnBatches.length > 1 && i === columnBatches.length - 1) || (columnBatches.length > 3 && i === columnBatches.length - 2)"
										:filters="filtersCombined"
										:filtersColumn="filtersColumn"
										:isOrderedOrginal="isOrderedOrginal"
										:joins="relationsJoined"
										:key="b.key"
										:orders="orders"
										:relationId="query.relationId"
										:rowCount="count"
										:show="columnBatchIndexOption === i"
									/>
								</th>
								<!-- empty column for taking remaining space & header toggle action -->
								<th>
									<div class="headerToggle" v-if="!showHeader">
										<my-button image="toggleDown.png"
											@trigger="toggleHeader"
											:captionTitle="capApp.button.collapseHeader"
											:naked="true"
										/>
									</div>
								</th>
							</tr>
						</thead>
						<tbody>
							<!-- result row actions (only available if list is input) -->
							<tr v-if="showInputHeader" class="list-input-row-actions">
								<td colspan="999">
									<div class="sub-actions default-inputs">
										<select
											v-if="hasChoices"
											@change="reloadInside('choice')"
											v-model="choiceId"
										>
											<option v-for="c in query.choices" :value="c.id">
												{{ getCaption('queryChoiceTitle',moduleId,c.id,c.captions,c.name) }}
											</option>
										</select>
										
										<my-input-offset
											@input="offset = $event;reloadInside()"
											:caption="false"
											:limit="limit"
											:offset="offset"
											:total="count"
										/>
										
										<input autocomplete="off" class="short" enterkeyhint="send" type="text"
											v-if="filterQuick"
											@keyup.enter="updatedFilterQuick"
											v-model="filtersQuick"
											:placeholder="capGen.threeDots"
											:title="capApp.quick"
										/>
										
										<my-button image="checkbox1.png"
											v-if="showInputAddAll"
											@trigger="clickRowAll"
											:caption="capApp.button.all"
											:captionTitle="capApp.button.allHint"
											:naked="true"
										/>
									</div>
								</td>
							</tr>
							
							<!-- result rows -->
							<tr
								v-for="(r,ri) in rowsClear"
								@click.ctrl.exact="clickRow(r,true)"
								@click.left.exact="clickRow(r,false)"
								@click.middle.exact="clickRow(r,true)"
								@keyup.enter.space="clickRow(r,false)"
								:class="{ rowSelect:rowSelect && !inputIsReadonly, active:popUpFormInline !== null && popUpFormInline.recordIds.includes(r.indexRecordIds['0']) }"
								:key="ri + '_' + r.indexRecordIds['0']"
								:ref="refTabindex+String(ri)"
								:tabindex="isInput ? '0' : '-1'"
							>
								<td v-if="hasBulkActions" @click.stop="" class="minimum checkbox">
									<img class="clickable" tabindex="0"
										@click="selectRow(ri)"
										@keyup.enter.space.stop="selectRow(ri)"
										:src="selectedRows.includes(ri) ? 'images/checkboxSmall1.png' : 'images/checkboxSmall0.png'"
									/>
								</td>
								
								<!-- row values per column batch -->
								<td v-for="b in columnBatches">
									<div class="columnBatch"
										:class="{ colored:b.columnIndexColor !== -1, vertical:b.vertical }"
										:style="b.columnIndexColor === -1 ? '' : displayColorColumn(r.values[b.columnIndexColor])"
									>
										<my-value-rich
											v-for="ind in b.columnIndexes.filter(v => v !== b.columnIndexColor && r.values[v] !== null)"
											@clipboard="$emit('clipboard')"
											:alignEnd="columns[ind].flags.alignEnd"
											:alignMid="columns[ind].flags.alignMid"
											:attributeId="columns[ind].attributeId"
											:basis="columns[ind].basis"
											:bold="columns[ind].flags.bold"
											:boolAtrIcon="columns[ind].flags.boolAtrIcon"
											:clipboard="columns[ind].flags.clipboard"
											:display="columns[ind].display"
											:italic="columns[ind].flags.italic"
											:key="ind"
											:length="columns[ind].length"
											:monospace="columns[ind].flags.monospace"
											:previewLarge="columns[ind].flags.previewLarge"
											:value="r.values[ind]"
											:wrap="columns[ind].flags.wrap"
										/>
									</div>
								</td>
								<!-- empty column for taking remaining space -->
								<td></td>
							</tr>
							
							<!-- no results message -->
							<tr v-if="rows.length === 0">
								<td v-if="rowsFetching" colspan="999">
									<div class="fetching">
										<img src="images/load.gif">
										<span>{{ capApp.fetching }}</span>
									</div>
								</td>
								<td v-if="!rowsFetching" colspan="999">
									<div class="columnBatch">{{ capGen.resultsNone }}</div>
								</td>
							</tr>
						</tbody>
						<tfoot>
							<!-- result aggregations -->
							<my-list-aggregate ref="aggregations"
								:columnBatches="columnBatches"
								:columnIdMapAggr="columnIdMapAggr"
								:columns="columns"
								:filters="filtersCombined"
								:leaveOneEmpty="hasBulkActions"
								:joins="relationsJoined"
								:relationId="query.relationId"
							/>
						</tfoot>
					</table>
					
					<div class="empty-space"
						v-if="isTable"
						@click="clickOnEmpty"
					></div>
					
					<!-- list results as cards -->
					<template v-if="isCards">
					
						<!-- actions -->
						<div class="card-actions default-inputs" v-if="hasResults" :class="{ atTop:!showHeader }">
							<div class="row centered">
								<my-button
									v-if="hasBulkActions"
									@trigger="selectRowsAllToggle"
									:caption="capApp.button.all"
									:captionTitle="capApp.button.allHint"
									:image="rows.length !== 0 && selectedRows.length === rows.length ? 'checkbox1.png' : 'checkbox0.png'"
									:naked="true"
								/>
							</div>
							
							<div class="row centered">
								<!-- sorting -->
								<template v-if="hasResults">
									<span class="select">{{ capApp.orderBy }}</span>
									<select @change="cardsSetOrderBy($event.target.value)" :value="cardsOrderByColumnBatchIndex">
										<option value="-1">-</option>
										<option v-for="(b,i) in columnBatches" :value="i">{{ b.caption }}</option>
									</select>	
									<my-button
										v-if="cardsOrderByColumnBatchIndex !== -1"
										@trigger="cardsToggleOrderBy"
										:image="orders[0].ascending ? 'triangleUp.png' : 'triangleDown.png'"
										:naked="true"
									/>
								</template>
							</div>
							
							<div class="row centered">
								<my-button image="toggleDown.png"
									v-if="!showHeader"
									@trigger="toggleHeader"
									:naked="true"
								/>
							</div>
						</div>
						
						<div class="cards" @click="clickOnEmpty" :id="usesPageHistory ? scrollFormId : null">
							
							<!-- no results message -->
							<template v-if="!hasResults">
								<div class="card no-results" v-if="!rowsFetching">
									{{ capGen.resultsNone }}
								</div>
								<div class="card no-results fetching" v-if="rowsFetching">
									<img src="images/load.gif">
									<span>{{ capApp.fetching }}</span>
								</div>
							</template>
							
							<div class="card"
								v-for="(r,ri) in rowsClear"
								@click.ctrl.exact.stop="clickRow(r,true)"
								@click.left.stop.exact="clickRow(r,false)"
								@click.middle.exact.stop="clickRow(r,true)"
								@keyup.enter.space.stop="clickRow(r,false)"
								:class="{ rowSelect:rowSelect && !inputIsReadonly }"
								:key="ri + '_' + r.indexRecordIds['0']"
								:ref="refTabindex+String(ri)"
								:tabindex="isInput ? '0' : '-1'"
							>
								<div class="actions" v-if="hasBulkActions" @click.stop="">
									<my-button
										@trigger="selectRow(ri)"
										:image="selectedRows.includes(ri) ? 'checkbox1.png' : 'checkbox0.png'"
										:naked="true"
									/>
									<my-button image="delete.png"
										@trigger="delAsk([ri])"
										:naked="true"
									/>
								</div>
								
								<!-- row values per column batch -->
								<table>
									<tbody>
										<tr v-for="b in columnBatches">
											<td class="caption" v-if="cardsCaptions">{{ b.caption }}</td>
											<td>
												<div class="columnBatch listCards" :class="{ vertical:b.vertical }">
													<my-value-rich
														v-for="ind in b.columnIndexes.filter(v => r.values[v] !== null)"
														@clipboard="$emit('clipboard')"
														:alignEnd="columns[ind].flags.alignEnd"
														:alignMid="columns[ind].flags.alignMid"
														:attributeId="columns[ind].attributeId"
														:basis="columns[ind].basis"
														:bold="columns[ind].flags.bold"
														:boolAtrIcon="columns[ind].flags.boolAtrIcon"
														:clipboard="columns[ind].flags.clipboard"
														:display="columns[ind].display"
														:italic="columns[ind].flags.italic"
														:key="ind"
														:length="columns[ind].length"
														:monospace="columns[ind].flags.monospace"
														:previewLarge="columns[ind].flags.previewLarge"
														:value="r.values[ind]"
														:wrap="columns[ind].flags.wrap"
													/>
												</div>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
					</template>
				</div>
				
				<!-- inline form -->
				<my-form class="inline"
					v-if="popUpFormInline !== null"
					@close="$emit('close-inline')"
					@record-deleted="get"
					@record-updated="get"
					@records-open="popUpFormInline.recordIds = $event"
					:attributeIdMapDef="popUpFormInline.attributeIdMapDef"
					:formId="popUpFormInline.formId"
					:hasHelp="false"
					:hasLog="false"
					:isPopUp="true"
					:isPopUpFloating="false"
					:moduleId="popUpFormInline.moduleId"
					:recordIds="popUpFormInline.recordIds"
					:style="popUpFormInline.style"
				/>
			</div>
		</template>
	</div>`,
	props:{
		autoRenewDefault:{ required:false, default:null },                   // default for list refresh (number in seconds)
		caption:         { type:String,  required:false, default:'' },       // caption to display in list header
		choices:         { type:Array,   required:false, default:() => [] }, // processed query choices
		collections:     { type:Array,   required:false, default:() => [] }, // consumed collections to filter by user input
		collectionIdMapIndexes:{ type:Object, required:false, default:() => {return {}} },
		columns:         { type:Array,   required:true },                    // list columns, processed (applied filter values, only columns shown by user choice)
		columnsAll:      { type:Array,   required:false, default:() => [] }, // list columns, all
		dataOptions:     { type:Number,  required:false, default:0 },        // data permissions following form states
		favoriteId:      { required:false, default:null },
		fieldId:         { type:String,  required:true },
		filters:         { type:Array,   required:true },                    // processed query filters
		layoutDefault:   { type:String,  required:false, default:'table' },  // default list layout: table, cards
		limitDefault:    { type:Number,  required:false, default:10 },       // default list limit
		moduleId:        { type:String,  required:true },
		popUpFormInline: { required:false, default:null },                   // form to show inside list
		query:           { type:Object,  required:true },                    // list query
		
		// toggles
		csvExport:      { type:Boolean, required:false, default:false },
		csvImport:      { type:Boolean, required:false, default:false },
		dropdownShow:   { type:Boolean, required:false, default:false },
		filterQuick:    { type:Boolean, required:false, default:false }, // enable quick filter
		formLoading:    { type:Boolean, required:false, default:false }, // trigger and control list reloads
		hasOpenForm:    { type:Boolean, required:false, default:false }, // list can open record in form
		hasOpenFormBulk:{ type:Boolean, required:false, default:false }, // list can open records in bulk form
		header:         { type:Boolean, required:false, default:true  }, // show list header
		isInput:        { type:Boolean, required:false, default:false }, // use list as input
		isHidden:       { type:Boolean, required:false, default:false }, // list is not visible and therefore not loaded/updated
		isSingleField:  { type:Boolean, required:false, default:false }, // list is single field within a parent (form/tab - not container!)
		loadWhileHidden:{ type:Boolean, required:false, default:false },
		usesPageHistory:{ type:Boolean, required:false, default:false }, // list uses page getters for filtering/sorting/etc.
		
		// list as input field
		inputAsCategory:{ type:Boolean, required:false, default:false },    // input is category selector (all records are shown, active ones are checked off)
		inputAutoSelect:{ type:Number,  required:false, default:0 },        // # of records to auto select (2 = first two, -3 = last three, 0 = none)
		inputIsNew:     { type:Boolean, required:false, default:false },    // input field belongs to new record
		inputIsReadonly:{ type:Boolean, required:false, default:false },    // input field is readonly
		inputMulti:     { type:Boolean, required:false, default:false },    // input has multiple records to represent (instead of just one)
		inputRecordIds: { type:Array,   required:false, default:() => [] }, // input record IDs, representing active values to show
		inputValid:     { type:Boolean, required:false, default:true }
	},
	emits:[
		'clipboard','close-inline','dropdown-show','open-form',
		'open-form-bulk','record-count-change','record-removed',
		'records-selected','records-selected-init','set-args',
		'set-column-ids-by-user','set-collection-indexes'
	],
	data() {
		return {
			// list state
			autoRenew:-1,               // auto renew list data every X seconds, -1 if disabled
			autoRenewTimer:null,        // interval timer for auto renew
			choiceId:null,              // currently active choice
			columnBatchIndexOption:-1,  // show options for column batch by index
			columnBatchSort:[[],[]],
			focused:false,
			inputAutoSelectDone:false,
			inputDropdownUpwards:false, // show dropdown above input
			layout:'table',             // current list layout (table, cards)
			rowsFetching:false,         // row values are being fetched
			selectedRows:[],            // bulk selected rows by row index
			showCsv:false,              // show UI for CSV import/export
			showFilters:false,          // show UI for user filters
			showHeader:true,            // show UI for list header
			showOptions:false,          // show UI for list options
			
			// list constants
			refTabindex:'input_row_', // prefix for vue references to tabindex elements
			
			// list card layout state
			cardsOrderByColumnBatchIndex:-1,
			cardsCaptions:true,
			
			// list data
			columnIdMapAggr:{}, // aggregators by column ID
			count:0,            // total result set count
			limit:0,            // current result limit
			offset:0,           // current result offset
			orders:[],          // current column orderings
			rows:[],            // current result set
			filtersColumn:[],   // current user column filters
			filtersQuick:'',    // current user quick text filter
			filtersUser:[],     // current user filters
			
			// list input data
			rowsInput:[], // rows that reflect current input (following active record IDs)
			              // as opposed to list rows which show lookup data (regular list or input dropdown)
			
			// list header
			headerCheckTimer:null,
			headerElements:[],               // elements that are shown, based on available space
			headerElementsAvailableInOrder:[ // elements that can be shown, in order of priority
				'collectionValuesAll',       // optional, show all collection filter values
				'collectionValuesFew',       // optional, show few collection filter values
				'listTitle',                 // optional
				'actionTitles',              // optional
				'refresh',                   // optional
				'offsetArrows',              // optional
				'collectionTitles',          // optional, show collection titles
				'headerCollapse',            // optional
				'actionsReadonly',           // optional
				'resultsCount'               // not important
			]
		};
	},
	computed:{
		filtersCombined:(s) => {
			// already encapsulated filters: list, choice, quick, column
			let filters = s.filters
				.concat(s.filtersColumn)
				.concat(s.filtersParsedQuick)
				.concat(s.getFiltersEncapsulated(
					JSON.parse(JSON.stringify(s.filtersUser))
				))
				.concat(s.choiceFilters);
			
			if(s.anyInputRows)
				filters.push(s.getQueryAttributesPkFilter(
					s.query.relationId,s.inputRecordIds,0,true
				));
			
			return filters;
		},
		hasDeleteAny:(s) => {
			if(!s.checkDataOptions(1,s.dataOptions))
				return false;

			for(let join of s.joins) {
				if(join.applyDelete)
					return true;
			}
			return false;
		},
		hasGalleryIcon:(s) => {
			return s.columns.length !== 0 &&
				s.columns[0].display === 'gallery' &&
				(s.columns[0].onMobile || !s.isMobile) &&
				(!s.isInput || s.rowsInput.length !== 0) &&
				s.attributeIdMap[s.columns[0].attributeId].content === 'files';
		},
		hoverCaption:(s) => {
			if     (s.showCsv)     return s.capApp.button.csv;
			else if(s.showFilters) return s.capGen.button.filterHint;
			else if(s.showOptions) return s.capGen.options;
			return '';
		},
		hoverIconSrc:(s) => {
			if     (s.showCsv)     return 'images/fileSheet.png';
			else if(s.showFilters) return 'images/filterCog.png';
			else if(s.showOptions) return 'images/listCog.png';
			return '';
		},
		inputLinePlaceholder:(s) => {
			if(s.focused) return '';
			return s.anyInputRows ? s.capApp.inputPlaceholderAdd : s.capGen.threeDots;
		},
		pageCount:(s) => {
			if(s.count === 0) return 0;
			
			const cnt = Math.floor(s.count / s.limit);
			return s.count % s.limit !== 0 ? cnt+1 : cnt;
		},

		// filters
		filtersParsedQuick:(s) => {
			if(s.filtersQuick === '') return [];
			
			let out = [];
			let addFilter = (operator,atrId,atrIndex,dict) => {
				out.push({
					connector:out.length === 0 ? 'AND' : 'OR',
					index:0,
					operator:operator,
					side0:{ attributeId:atrId, attributeIndex:atrIndex, brackets:0 },
					side1:{ brackets:0, ftsDict:dict, value:s.filtersQuick }
				});
			};
			
			for(let c of s.columns) {
				let a = s.attributeIdMap[c.attributeId];
				if(c.subQuery || s.isAttributeFiles(a.content) ||
					(c.aggregator !== null && c.aggregator !== 'record')) {
					
					continue;
				}
				
				// check for available full text search
				let ftsAvailable = false;
				let r = s.relationIdMap[a.relationId];
				for(let ind of r.indexes) {
					if(ind.method === 'GIN' && ind.attributes.length === 1
						&& ind.attributes[0].attributeId === a.id) {
						
						ftsAvailable = true;
						break;
					}
				}
				
				if(!ftsAvailable) {
					addFilter('ILIKE',c.attributeId,c.index,null);
				}
				else {
					// add FTS filter for each active dictionary, use 'simple' otherwise
					for(let dict of s.settings.searchDictionaries) {
						addFilter('@@',c.attributeId,c.index,dict);
					}
					if(s.settings.searchDictionaries.length === 0)
						addFilter('@@',c.attributeId,c.index,'simple');
				}
			}
			return s.getFiltersEncapsulated(out);
		},
		
		// simple
		anyInputRows:        (s) => s.inputRecordIds.length !== 0,
		autoSelect:          (s) => s.inputIsNew && s.inputAutoSelect !== 0 && !s.inputAutoSelectDone,
		choiceFilters:       (s) => s.getChoiceFilters(s.choices,s.choiceId),
		columnBatches:       (s) => s.getColumnBatches(s.moduleId,s.columns,[],s.orders,s.columnBatchSort[0],true),
		columnBatchesAll:    (s) => s.getColumnBatches(s.moduleId,s.columnsAll,[],s.orders,[],true),
		expressions:         (s) => s.getQueryExpressions(s.columns),
		hasBulkActions:      (s) => !s.isInput && s.rows.length !== 0 && (s.hasUpdateBulk || s.hasDeleteAny),
		hasChoices:          (s) => s.query.choices.length > 1,
		hasCreate:           (s) => s.checkDataOptions(4,s.dataOptions) && s.joins.length !== 0 && s.joins[0].applyCreate && s.hasOpenForm,
		hasPaging:           (s) => s.query.fixedLimit === 0,
		hasResults:          (s) => s.rowsClear.length !== 0,
		hasUpdate:           (s) => s.checkDataOptions(2,s.dataOptions) && s.joins.length !== 0 && s.joins[0].applyUpdate && s.hasOpenForm,
		hasUpdateBulk:       (s) => s.checkDataOptions(2,s.dataOptions) && s.joins.length !== 0 && s.joins[0].applyUpdate && s.hasOpenFormBulk,
		isCards:             (s) => s.layout === 'cards',
		isOrderedOrginal:    (s) => s.deepIsEqual(s.query.orders,s.orders),
		isTable:             (s) => s.layout === 'table',
		joins:               (s) => s.fillRelationRecordIds(s.query.joins),
		ordersOriginal:      (s) => JSON.parse(JSON.stringify(s.query.orders)),
		relationsJoined:     (s) => s.getRelationsJoined(s.joins),
		rowSelect:           (s) => s.isInput || s.hasUpdate,
		rowsClear:           (s) => s.rows.filter(v => !s.inputRecordIds.includes(v.indexRecordIds['0'])),
		showActionTitles:    (s) => s.headerElements.includes('actionTitles'),
		showCollectionTitles:(s) => s.headerElements.includes('collectionTitles'),
		showHover:           (s) => s.showCsv || s.showFilters || s.showOptions,
		showInputAddLine:    (s) => !s.inputAsCategory && (!s.anyInputRows || (s.inputMulti && !s.inputIsReadonly)),
		showInputAddAll:     (s) => s.inputMulti && s.hasResults,
		showInputHeader:     (s) => s.isInput && (s.filterQuick || s.hasChoices || s.showInputAddAll || s.offset !== 0 || s.count > s.limit),
		showOffsetArrows:    (s) => s.headerElements.includes('offsetArrows'),
		showRefresh:         (s) => s.headerElements.includes('refresh'),
		showResultsCount:    (s) => s.headerElements.includes('resultsCount'),
		showTitle:           (s) => s.headerElements.includes('listTitle'),
		showCollectionCnt:   (s) => {
			if(s.headerElements.includes('collectionValuesAll')) return 999;
			if(s.headerElements.includes('collectionValuesFew')) return 2;
			return 0;
		},
		
		// stores
		relationIdMap: (s) => s.$store.getters['schema/relationIdMap'],
		attributeIdMap:(s) => s.$store.getters['schema/attributeIdMap'],
		appResized:    (s) => s.$store.getters.appResized,
		capApp:        (s) => s.$store.getters.captions.list,
		capGen:        (s) => s.$store.getters.captions.generic,
		isMobile:      (s) => s.$store.getters.isMobile,
		scrollFormId:  (s) => s.$store.getters.constants.scrollFormId,
		settings:      (s) => s.$store.getters.settings
	},
	beforeCreate() {
		// import at runtime due to circular dependencies
		this.$options.components.MyForm = MyForm;
	},
	mounted() {
		if(!this.isInput)
			this.resized();
		
		// setup watchers
		this.$watch('appResized',this.resized);
		this.$watch('favoriteId',this.reloadOptions);
		this.$watch('dropdownShow',(v) => {
			if(!v) return;

			this.reloadInside('dropdown');
			
			const inputEl = this.$refs.content.querySelector('[data-is-input-empty="1"]');
			if(inputEl !== null)
				inputEl.focus();
		});
		this.$watch('formLoading',(val) => {
			if(val) return;
			this.inputAutoSelectDone = false;
			this.reloadOutside();
		});
		this.$watch('isHidden',(val) => {
			if(!val) {
				this.reloadOutside();
				this.resized();
			}
		});
		this.$watch('loadWhileHidden',(val) => {
			if(val) {
				this.reloadOutside();
				this.resized();
			}
		});
		this.$watch(() => [this.choices,this.columns,this.columnsAll,this.filters],(newVals,oldVals) => {
			for(let i = 0, j = newVals.length; i < j; i++) {
				if(JSON.stringify(newVals[i]) !== JSON.stringify(oldVals[i])) {
					this.count = 0;
					this.rows  = [];
					// column filters & orders can become invalid, if a user hides a column in list options
					this.removeInvalidFilters();
					this.removeInvalidOrders();
					this.reloadOutside();
					return;
				}
			}
		});
		if(this.isInput && !this.inputAsCategory) {
			this.$watch('inputRecordIds',(val) => {
				// update input if record IDs are different (different count or IDs)
				if(val.length !== this.rowsInput.length)
					return this.reloadOutside();
				
				for(let i = 0, j = this.rowsInput.length; i < j; i++) {
					if(!val.includes(this.rowsInput[i].indexRecordIds[0]))
						return this.reloadOutside();
				}
			});
		}
		if(this.usesPageHistory) {
			this.$watch(() => [this.$route.path,this.$route.query],(newVals,oldVals) => {
				if(this.routeChangeFieldReload(newVals,oldVals)) {
					this.paramsUpdated();
					this.reloadOutside();
				}
			});
		}

		// initialize list options
		this.reloadOptions();
		this.setAutoRenewTimer(this.autoRenew);

		// remove invalid filters & orders in case module schema changed
		// must occur after reloadOptions() as user field options are loaded there
		this.removeInvalidFilters();
		this.removeInvalidOrders();

		// setup handlers
		window.addEventListener('keydown',this.handleHotkeys);
	},
	beforeUnmount() {
		this.clearAutoRenewTimer();
	},
	unmounted() {
		window.removeEventListener('keydown',this.handleHotkeys);
	},
	methods:{
		// externals
		checkDataOptions,
		colorAdjustBg,
		colorMakeContrastFont,
		consoleError,
		deepIsEqual,
		fieldOptionGet,
		fieldOptionSet,
		fillRelationRecordIds,
		getCaption,
		getChoiceFilters,
		getColumnBatches,
		getColumnTitle,
		getFiltersEncapsulated,
		getOrderIndexesFromColumnBatch,
		getQueryAttributesPkFilter,
		getQueryExpressions,
		getRelationsJoined,
		getRowsDecrypted,
		isAttributeFiles,
		isDropdownUpwards,
		layoutSettleSpace,
		routeChangeFieldReload,
		routeParseParams,

		handleHotkeys(e) {
			if(e.key === 'Escape' && (this.showCsv || this.showFilters || this.showOptions)) {
				this.showCsv       = false;
				this.showFilters   = false;
				this.showOptions   = false;
				e.preventDefault();
			}
		},
		
		// presentation
		displayRecordCheck(state) {
			if(this.inputMulti)
				return state ? 'checkbox1.png' : 'checkbox0.png';
			
			return state ? 'radio1.png' : 'radio0.png';
		},
		displayColorColumn(color) {
			if(color === null) return '';
			
			let bg   = this.colorAdjustBg(color);
			let font = this.colorMakeContrastFont(bg);
			return `background-color:${bg};color:${font};`;
		},
		resized() {
			if(this.headerCheckTimer !== null)
				clearTimeout(this.headerCheckTimer);
			
			this.headerCheckTimer = setTimeout(() => {
				this.headerElements = JSON.parse(JSON.stringify(this.headerElementsAvailableInOrder));
				this.$nextTick(() => this.layoutSettleSpace(this.headerElements,this.$refs.empty));
			},200);
		},
		updateDropdownDirection() {
			let headersPx  = 200; // rough height in px of all headers (menu/form) combined
			let rowPx      = 38;  // rough height in px of one dropdown list row
			let dropdownPx = rowPx * (this.rows.length+1); // +1 for action row
			
			this.inputDropdownUpwards =
				this.isDropdownUpwards(this.$el,dropdownPx,headersPx);
		},
		
		// reloads
		reloadAggregations(nextTick) {
			if(!this.isTable || typeof this.$refs.aggregations === 'undefined' || this.$refs.aggregations === null)
				return;

			if(nextTick) this.$nextTick(this.$refs.aggregations.get);
			else         this.$refs.aggregations.get();
		},
		reloadOptions() {
			this.autoRenew       = this.fieldOptionGet(this.favoriteId,this.fieldId,'autoRenew',(this.autoRenewDefault === null ? -1 : this.autoRenewDefault));
			this.cardsCaptions   = this.fieldOptionGet(this.favoriteId,this.fieldId,'cardsCaptions',true);
			this.choiceId        = this.fieldOptionGet(this.favoriteId,this.fieldId,'choiceId',this.choices.length === 0 ? null : this.choices[0].id);
			this.columnBatchSort = this.fieldOptionGet(this.favoriteId,this.fieldId,'columnBatchSort',[[],[]]);
			this.columnIdMapAggr = this.fieldOptionGet(this.favoriteId,this.fieldId,'columnIdMapAggr',{});
			this.filtersColumn   = this.fieldOptionGet(this.favoriteId,this.fieldId,'filtersColumn',[]);
			this.filtersUser     = this.fieldOptionGet(this.favoriteId,this.fieldId,'filtersUser',[]);
			this.showHeader      = this.fieldOptionGet(this.favoriteId,this.fieldId,'header',true);
			this.limit           = this.fieldOptionGet(this.favoriteId,this.fieldId,'limit',this.limitDefault);
			this.layout          = this.fieldOptionGet(this.favoriteId,this.fieldId,'layout',this.layoutDefault);
			this.orders          = this.fieldOptionGet(this.favoriteId,this.fieldId,'orders',this.ordersOriginal);

			if(this.usesPageHistory) {
				// set initial states via route parameters
				this.paramsUpdated();     // load existing parameters from route query
				this.paramsUpdate(false); // overwrite parameters (in case defaults are set)
			}
		},
		reloadInside(entity) {
			// inside state has changed, reload list (not relevant for list input)
			switch(entity) {
				case 'dropdown':      // fallthrough
				case 'filtersQuick':  // fallthrough
				case 'filtersColumn': // fallthrough
				case 'filtersUser': this.offset = 0; break;
				case 'choice':
					this.offset = 0;
					this.fieldOptionSet(this.favoriteId,this.fieldId,'choiceId',this.choiceId);
				break;
				case 'order':
					this.offset = 0;
				break;
				default: break; // no special treatment
			}
			
			// update route parameters, reloads list via watcher
			// enables browser history for fullpage list navigation
			//  special cases: column/quick/user filters & manuel reloads (no page param change)
			if(this.usesPageHistory && !['filtersColumn','filtersQuick','filtersUser','limit','manual'].includes(entity))
				return this.paramsUpdate(true);
			
			this.get();
		},
		reloadOutside() {
			// outside state has changed, reload list or list input
			if(!this.isInput)
				return this.get();
			
			this.getInput();
		},
		
		// parsing
		paramsUpdate(pushHistory) {
			// fullpage lists update their form arguments, this results in history change
			// history change then triggers form load
			let orders = [];
			for(let o of this.orders) {
				if(typeof o.expressionPos !== 'undefined')
					// sort by expression position
					orders.push(`expr_${o.expressionPos}_${o.ascending ? 'asc' : 'desc'}`);
				else
					// sort by attribute
					orders.push(`${o.index}_${o.attributeId}_${o.ascending ? 'asc' : 'desc'}`);
			}
			
			let args = [];
			if(this.choiceId !== null) args.push(`choice=${this.choiceId}`);
			if(this.offset   !== 0)    args.push(`offset=${this.offset}`);
			if(orders.length !== 0)    args.push(`orderby=${orders.join(',')}`);
			
			this.$emit('set-args',args,pushHistory);
		},
		paramsUpdated() {
			// apply query parameters
			let params = {
				choice: { parse:'string',   value:this.choiceId },
				offset: { parse:'int',      value:0 },
				orderby:{ parse:'listOrder',value:JSON.stringify(this.orders) }
			};
			this.routeParseParams(params);
			
			if(this.choiceId !== params.choice.value)
				this.choiceId = params.choice.value;
			
			this.offset = params.offset.value;
			this.orders = JSON.parse(params.orderby.value);
			
			// apply first order for card layout selector
			this.cardsOrderByColumnBatchIndex = -1;
			for(let i = 0, j = this.columnBatches.length; i < j; i++) {
				if(this.columnBatches[i].orderIndexesUsed.length !== 0) {
					this.cardsOrderByColumnBatchIndex = i;
					break;
				}
			}
		},
		
		// user actions, generic
		blur() {
			this.focused = false;
			if(this.dropdownShow)
				this.$emit('dropdown-show',false);
		},
		clearAutoRenewTimer() {
			if(this.autoRenewTimer !== null)
				clearInterval(this.autoRenewTimer);
		},
		clickColumn(columnBatchIndex) {
			this.columnBatchIndexOption = this.columnBatchIndexOption === columnBatchIndex
				? -1 : columnBatchIndex;
		},
		clickOpen(row,middleClick) {
			if(this.hasUpdate)
				this.$emit('open-form',[row],middleClick);
		},
		clickOnEmpty() {
			this.$emit('close-inline');
		},
		clickInputEmpty() {
			if(!this.inputIsReadonly && !this.dropdownShow)
				this.$emit('dropdown-show',true);
		},
		clickInputRow() {
			if(!this.inputIsReadonly && !this.inputAsCategory && !this.showInputAddLine)
				this.$emit('dropdown-show',!this.dropdownShow);
		},
		clickRow(row,middleClick) {
			if(!this.isInput)
				return this.clickOpen(row,middleClick);
			
			if(this.inputMulti) this.rowsInput.push(row);
			else                this.rowsInput = [row];

			this.$emit('dropdown-show',false);
			this.filtersQuick = '';
			this.$emit('records-selected',[row.indexRecordIds['0']]);
		},
		clickRowAll() {
			let ids = [];
			for(const row of this.rows) {
				ids.push(row.indexRecordIds['0']);
			}
			this.rowsInput = this.rowsInput.concat(this.rows);
			this.filtersQuick = '';
			this.$emit('dropdown-show',false);
			this.$emit('records-selected',ids);
		},
		closeHover() {
			this.showCsv     = false;
			this.showFilters = false;
			this.showOptions = false;
		},
		escape() {
			if(this.isInput)
				this.blur();
		},
		focus() {
			if(!this.inputIsReadonly && this.isInput && !this.inputAsCategory && !this.dropdownShow) {
				this.focused      = true;
				this.filtersQuick = '';
			}
		},
		keyDown(e) {
			let focusTarget = null;
			let arrow       = false;
			
			switch(e.code) {
				case 'ArrowDown':  arrow = true; focusTarget = e.target.nextElementSibling;     break;
				case 'ArrowLeft':  arrow = true; focusTarget = e.target.previousElementSibling; break;
				case 'ArrowRight': arrow = true; focusTarget = e.target.nextElementSibling;     break;
				case 'ArrowUp':    arrow = true; focusTarget = e.target.previousElementSibling; break;
				case 'Escape':     e.preventDefault(); this.escape(); break;
			}
			
			// arrow key used and tab focus target is available
			if(arrow && focusTarget !== null && focusTarget.tabIndex !== -1) {
				e.preventDefault();
				return focusTarget.focus();
			}
			
			// arrow key used in regular list input
			if(arrow && this.isInput && !this.inputAsCategory) {
				
				// show dropdown
				if(!this.dropdownShow) {
					e.preventDefault();
					return this.$emit('dropdown-show',true);
				}
				
				// focus first/last input element
				if(this.dropdownShow && this.rows.length !== 0) {
					e.preventDefault();
					
					if(e.target !== this.$refs[this.refTabindex+'0'][0])
						return this.$refs[this.refTabindex+'0'][0].focus();
					
					return this.$refs[this.refTabindex+String(this.rows.length-1)][0].focus();
				}
			}
		},
		resetColumns() {
			this.setColumnBatchSort([[],[]]);
			// setting columns will reload data & aggregations
			this.$nextTick(() => this.$emit('set-column-ids-by-user',[]));
		},
		setAggregators(columnId,aggregator) {
			if(!this.isTable) return;
			
			if(aggregator !== null) this.columnIdMapAggr[columnId] = aggregator;
			else                    delete(this.columnIdMapAggr[columnId]);
			
			this.fieldOptionSet(this.favoriteId,this.fieldId,'columnIdMapAggr',this.columnIdMapAggr);
			this.reloadAggregations(false);
		},
		setAutoRenewTimer(v) {
			this.clearAutoRenewTimer();

			// we use -1 instead of null to define disabled auto renew
			// NULL is removed as field option, making it impossible to disable the default setting
			if(v !== -1) {
				// apply min. interval
				if(v < 10) v = 10;

				this.autoRenewTimer = setInterval(this.get,v * 1000);
			}

			if(v !== this.autoRenew) {
				this.autoRenew = v;
				this.fieldOptionSet(this.favoriteId,this.fieldId,'autoRenew',v);
			}
		},
		setCardsCaptions(v) {
			this.cardsCaptions = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'cardsCaptions',v);
		},
		setColumnBatchSort(v) {
			this.columnBatchSort = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'columnBatchSort',v);
			this.reloadAggregations(true);
		},
		setColumnBatchFilters(v) {
			this.filtersColumn = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'filtersColumn',v);
			this.reloadInside('filtersColumn');
		},
		setLayout(v) {
			this.layout = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'layout',this.layout);
		},
		setLimit(v) {
			this.limit = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'limit',this.limit);
			this.reloadInside('limit');
		},
		setOrder(columnBatch,directionAsc) {
			// remove initial sorting (if active) when changing anything
			let orders = this.isOrderedOrginal ? [] : JSON.parse(JSON.stringify(this.orders));
			
			const orderIndexesUsed = this.getOrderIndexesFromColumnBatch(columnBatch,this.columns,orders);
			const notOrdered       = orderIndexesUsed.length === 0;
			if(notOrdered) {
				if(directionAsc === null)
					return; // not ordered and nothing to order, no change
				
				for(const columnIndexSort of columnBatch.columnIndexesSortBy) {
					const col = this.columns[columnIndexSort];
					if(col.subQuery) {
						orders.push({
							ascending:directionAsc,
							expressionPos:columnIndexSort // equal to expression index
						});
					}
					else {
						orders.push({
							ascending:directionAsc,
							attributeId:col.attributeId,
							index:col.index
						});
					}
				}
			} else {
				if(directionAsc === null) {
					orders = orders.filter((v,i) => !orderIndexesUsed.includes(i));
				} else {
					for(const orderIndex of orderIndexesUsed) {
						if(orders[orderIndex].ascending !== directionAsc)
							orders[orderIndex].ascending = directionAsc;
					}
				}
			}
			// when last order is removed, revert to original
			this.setOrders(orders.length === 0 ? this.ordersOriginal : orders);
		},
		setOrders(v) {
			this.orders = JSON.parse(JSON.stringify(v));
			this.fieldOptionSet(this.favoriteId,this.fieldId,'orders',this.orders);
			this.reloadInside('order');
		},
		setUserFilters(v) {
			this.filtersUser = v;
			this.fieldOptionSet(this.favoriteId,this.fieldId,'filtersUser',v);
			this.reloadInside('filtersUser');
		},
		toggleHeader() {
			this.showHeader = !this.showHeader;
			this.$store.commit('appResized');
			this.fieldOptionSet(this.favoriteId,this.fieldId,'header',this.showHeader);
		},
		toggleUserFilters() {
			this.showFilters = !this.showFilters;
		},
		updatedTextInput(event) {
			if(event.code === 'Tab' || event.code === 'Escape')
				return;
			
			// any input opens table (dropdown) if not open already
			if(!this.dropdownShow) {
				this.$emit('dropdown-show',true);
			}
			else if(event.code === 'Enter') {
				
				// if open already, enter can select first result
				if(this.rows.length !== 0)
					this.clickRow(this.rows[0],false);
				
				this.$emit('dropdown-show',false);
			}
			else if(event.code !== 'Escape') {
				
				// table already open, no enter/escape -> reload
				this.reloadInside('dropdown');
			}
		},
		updatedFilterQuick() {
			if(this.isInput && !this.dropdownShow)
				this.$emit('dropdown-show',true);
			else
				this.reloadInside('filtersQuick');
		},
		
		// user actions, cards layout
		cardsSetOrderBy(columnBatchIndexStr) {
			const columnBatchIndex = parseInt(columnBatchIndexStr);
			this.cardsOrderByColumnBatchIndex = columnBatchIndex;
			this.orders = [];
			
			if(columnBatchIndex === -1) return;
			
			this.setOrder(this.columnBatches[columnBatchIndex],true);
		},
		cardsToggleOrderBy() {
			const wasAsc = this.orders[0].ascending;
			this.orders = [];
			this.setOrder(this.columnBatches[this.cardsOrderByColumnBatchIndex],!wasAsc);
		},
		
		// user actions, inputs
		inputTriggerRow(row) {
			if(this.inputAsCategory && !this.inputIsReadonly) {
				const id = row.indexRecordIds['0'];

				if(this.inputRecordIds.includes(id)) this.$emit('record-removed', id);
				else                                 this.$emit('records-selected', [id]);
			}
			this.focus();
		},
		inputTriggerRowRemove(i) {
			this.$emit('record-removed',this.rowsInput[i].indexRecordIds['0']);
			this.rowsInput.splice(i,1);
			this.blur();
		},

		// cleanup
		removeInvalidFilters() {
			const f = (filters,columns,fncUpdate) => {
				let out = [];
				let br0 = 0;
				let br1 = 0;
				for(const f of filters) {
					br0 += f.side0.brackets;
					br1 += f.side1.brackets;
	
					// only allow filters based on available columns
					for(const c of columns) {
						if(c.attributeId === f.side0.attributeId && c.index === f.side0.attributeIndex) {
							out.push(f)
							break;
						}
					}
				}
				if(br0 !== br1) // brackets do not match, remove all filters
					return fncUpdate([]);

				if(out.length !== filters.length) // some filters were removed, update
					fncUpdate(out);
			};
			f(this.filtersColumn,this.columns,this.setColumnBatchFilters);
			f(this.filtersUser,this.columnsAll,this.setUserFilters);
		},
		removeInvalidOrders() {
			if(this.isOrderedOrginal) return;

			for(const o of this.orders) {
				// order by expression position (= index of retrieved columns), is only used for sub query columns
				if(typeof o.expressionPos !== 'undefined') {

					// order is invalid, if column index does not exist or column is not a sub query
					if(o.expressionPos > this.columns.length - 1 || !this.columns[o.expressionPos].subQuery)
						return this.setOrders(this.ordersOriginal);
					
					continue;
				}

				// order by attribute ID + relation index, check if corresponding column is displayed
				// only displayed columns are retrieved, any user-defined order must be visible to be removable by the user
				let columnFound = false;
				for(const c of this.columns) {
					if(o.index === c.index && o.attributeId === c.attributeId) {
						columnFound = true;
						break;
					}
				}

				// order is invalid if corresponding column is not displayed
				if(!columnFound)
					return this.setOrders(this.ordersOriginal);
			}
		},
		
		// bulk selection
		selectRow(rowIndex) {
			let pos = this.selectedRows.indexOf(rowIndex);
			if(pos === -1) this.selectedRows.push(rowIndex);
			else           this.selectedRows.splice(pos,1);
		},
		selectReset() {
			this.selectedRows = [];
		},
		selectRowsAllToggle() {
			if(this.rows.length === this.selectedRows.length) {
				this.selectedRows = [];
				return;
			}
			
			this.selectedRows = [];
			for(let i = 0, j = this.rows.length; i < j; i++) {
				this.selectedRows.push(i);
			}
		},
		selectRowsBulkEdit(rowIndexes) {
			let rows = [];
			for(let rowIndex of rowIndexes) {
				rows.push(this.rows[rowIndex]);
			}
			if(this.hasUpdateBulk && rows.length !== 0)
				this.$emit('open-form-bulk',rows,false);
		},
		
		// backend calls
		delAsk(rowIndexes) {
			this.$store.commit('dialog',{
				captionBody:this.capApp.dialog.delete,
				buttons:[{
					cancel:true,
					caption:this.capGen.button.delete,
					exec:this.del,
					image:'delete.png',
					params:[rowIndexes]
				},{
					caption:this.capGen.button.cancel,
					image:'cancel.png'
				}]
			});
		},
		del(rowIndexes) {
			let requests = [];
			for(let j of this.joins) {
				if(!j.applyDelete)
					continue;
				
				// specific rows selected
				for(let rowIndex of rowIndexes) {
					let r = this.rows[rowIndex];
					
					if(r.indexRecordIds[j.index] === 0)
						continue;
					
					requests.push(ws.prepare('data','del',{
						relationId:j.relationId,
						recordId:r.indexRecordIds[j.index]
					}));
				}
			}
			ws.sendMultiple(requests,true).then(
				this.get,
				this.$root.genericError
			);
		},
		get() {
			// do nothing if nothing is shown, form is loading or list is in a non-visible tab
			if(this.formLoading || (this.isInput && !this.dropdownShow) || (this.isHidden && !this.loadWhileHidden))
				return;
			
			// fix invalid offset (can occur when limit is changed)
			if(this.offset !== 0 && this.offset % this.limit !== 0)
				this.offset -= this.offset % this.limit;
			
			ws.send('data','get',{
				relationId:this.query.relationId,
				joins:this.relationsJoined,
				expressions:this.expressions,
				filters:this.filtersCombined,
				orders:this.orders,
				limit:this.limit,
				offset:this.offset
			},true).then(
				res => {
					const count = res.payload.count;
					this.rowsFetching = true;
					
					this.getRowsDecrypted(res.payload.rows,this.expressions).then(
						rows => {
							this.count        = count;
							this.rows         = rows;
							this.rowsFetching = false;
							this.selectReset();
							this.reloadAggregations(false);
							this.$emit('record-count-change',this.count);
							
							if(this.isInput)
								this.$nextTick(this.updateDropdownDirection);
						},
						this.consoleError
					);
					
				},
				this.$root.genericError
			);
		},
		getInput() {
			// nothing to get if form is currently loading
			if(this.formLoading)
				return;
			
			// reload record representation
			// must happen even if no GET is executed (clear inputs)
			// if list is reloaded, close dropdown
			this.rowsInput = [];

			if(this.dropdownShow)
				this.$emit('dropdown-show',false);
			
			// for inputs we only need data if:
			// * field is category input (always shows everything)
			// * auto select is active
			// * input has records to get data for
			if(!this.inputAsCategory && !this.autoSelect && !this.anyInputRows)
				return;
			
			// apply existing filters, except user filters (not relevant here)
			let filters = JSON.parse(JSON.stringify(this.filters));
			if(!this.inputAsCategory && this.anyInputRows)
				filters.push(this.getQueryAttributesPkFilter(
					this.query.relationId,this.inputRecordIds,0,false
				));
			
			ws.send('data','get',{
				relationId:this.query.relationId,
				joins:this.relationsJoined,
				expressions:this.expressions,
				filters:filters,
				orders:this.orders
			},false).then(
				res => {
					// apply results to input rows if input is category or specific record IDs were retrieved
					if(this.inputAsCategory || this.anyInputRows)
						this.getRowsDecrypted(res.payload.rows,this.expressions).then(
							rows => this.rowsInput = rows,
							this.consoleError
						);
					
					// remove invalid records (due to field filters)
					let recordIdsValid = [];
					let recordsRemoved = 0;
					for(let i = 0, j = res.payload.rows.length; i < j; i++) {
						recordIdsValid.push(res.payload.rows[i].indexRecordIds['0']);
					}
					
					for(let i = 0, j = this.inputRecordIds.length; i < j; i++) {
						if(!recordIdsValid.includes(this.inputRecordIds[i])) {
							this.$emit('record-removed',this.inputRecordIds[i]);
							recordsRemoved++;
						}
					}
					
					// auto-selection of records
					// only if nothing was selected or entire selection was invalid
					if(this.autoSelect && (this.inputRecordIds.length - recordsRemoved) === 0) {
						
						// select first/last X records
						let ids = [];
						if(this.inputAutoSelect > 0) {
							for(let i = 0; i < this.inputAutoSelect; i++) {
								if(res.payload.rows.length - 1 < i)
									break;
								
								ids.push(res.payload.rows[i].indexRecordIds['0']);
							}
						}
						else {
							for(let i = 0; i > this.inputAutoSelect; i--) {
								if(res.payload.rows.length - 1 + i < 0)
									break;
								
								ids.push(res.payload.rows[res.payload.rows.length - 1 + i].indexRecordIds['0']);
							}
						}
						if(ids.length !== 0)
							this.$emit('records-selected-init',this.inputMulti ? ids : ids[0]);
						
						this.inputAutoSelectDone = true;
					}
				},
				this.$root.genericError
			);
		}
	}
};