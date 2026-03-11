/**
 * Entity Service Adapter for Link Loom Cloud SDK.
 *
 * Standardized CRUD operations that enforce correct service method usage.
 * Mirrors the contract of the Sommatic client entityServiceAdapter but
 * works with service INSTANCES (provided by context) instead of constructors.
 *
 * Key rule: collection fetches always go through getByParameters()
 * to ensure queryselector is included in the URL path.
 */

/**
 * Adapter to fetch a list of entities from a given service instance.
 */
export async function fetchEntityCollection({ service, payload = {} }) {
  const {
    query = {},
    queryselector = 'all',
    exclude_status = 'deleted',
    page = 1,
    pageSize = 10,
  } = payload;

  try {
    return await service.getByParameters({
      queryselector,
      exclude_status,
      search: query.search || '',
      page,
      pageSize,
    });
  } catch (error) {
    console.error('[fetchEntityCollection] Error loading entities', error);
    return null;
  }
}

/**
 * Fetches multiple collections in parallel using service instances and payloads.
 *
 * Example:
 * const [definitions, preferences] = await fetchMultipleEntities([
 *   { service: appDefinitionService, payload: { queryselector: 'all' } },
 *   { service: appPreferenceService, payload: { queryselector: 'all' } },
 * ]);
 *
 * @param {Array<{ service: any, payload: object }>} list
 * @returns {Promise<Array>} results in same order
 */
export async function fetchMultipleEntities(list = []) {
  return Promise.all(
    list.map(({ service, payload }) => fetchEntityCollection({ service, payload }))
  );
}

/**
 * Adapter to fetch a single entity by ID using a given service instance.
 */
export async function fetchEntityRecord({ service, payload }) {
  try {
    const { id } = payload;

    if (typeof service.getById === 'function') {
      return await service.getById(id);
    }

    if (typeof service.getByParameters === 'function') {
      return await service.getByParameters({
        queryselector: 'id',
        search: id,
      });
    }

    console.error('[fetchEntityRecord] Service does not implement getById or getByParameters');
    return null;
  } catch (error) {
    console.error('[fetchEntityRecord] Error loading entity', error);
    return null;
  }
}

/**
 * Adapter to update an existing entity using a given service instance.
 */
export async function updateEntityRecord({ service, payload }) {
  try {
    if (payload._id) delete payload._id;
    return await service.update(payload);
  } catch (error) {
    console.error('[updateEntityRecord] Error updating entity', error);
    return null;
  }
}

/**
 * Adapter to create a new entity using a given service instance.
 */
export async function createEntityRecord({ service, payload }) {
  try {
    return await service.create(payload);
  } catch (error) {
    console.error('[createEntityRecord] Error creating entity', error);
    return null;
  }
}

/**
 * Adapter to delete an entity using a given service instance.
 */
export async function deleteEntityRecord({ service, payload }) {
  try {
    return await service.delete(payload);
  } catch (error) {
    console.error('[deleteEntityRecord] Error deleting entity', error);
    return null;
  }
}
